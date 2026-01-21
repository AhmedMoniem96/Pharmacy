from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Batch, StockLedger


def _ensure_company_scope(company, warehouse):
    if not company:
        raise serializers.ValidationError("User is not associated with a company.")
    if warehouse.branch.company_id != company.id:
        raise serializers.ValidationError("Warehouse does not belong to your company.")


def receive_stock(company, warehouse, items, ref_type, ref_id, user, note=None):
    _ensure_company_scope(company, warehouse)
    with transaction.atomic():
        updated_batches = []
        for item in items:
            product = item["product"]
            if product.company_id != company.id:
                raise serializers.ValidationError("Product does not belong to your company.")
            qty = item["qty"]
            try:
                batch = Batch.objects.select_for_update().get(
                    company=company,
                    product=product,
                    warehouse=warehouse,
                    batch_no=item["batch_no"],
                )
            except Batch.DoesNotExist:
                batch = Batch.objects.create(
                    company=company,
                    product=product,
                    warehouse=warehouse,
                    batch_no=item["batch_no"],
                    expiry_date=item["expiry_date"],
                    purchase_price=item["purchase_price"],
                    selling_price=item["selling_price"],
                    qty_on_hand=Decimal("0"),
                )
            batch.expiry_date = item["expiry_date"]
            batch.purchase_price = item["purchase_price"]
            batch.selling_price = item["selling_price"]
            batch.qty_on_hand = batch.qty_on_hand + qty
            batch.save(
                update_fields=[
                    "expiry_date",
                    "purchase_price",
                    "selling_price",
                    "qty_on_hand",
                ]
            )
            StockLedger.objects.create(
                company=company,
                warehouse=warehouse,
                product=product,
                batch=batch,
                movement_type=StockLedger.MovementType.IN,
                qty=qty,
                unit_cost=item["purchase_price"],
                ref_type=ref_type,
                ref_id=ref_id,
                note=note or "",
                created_by=user,
            )
            updated_batches.append(batch)
        return updated_batches


def sell_stock(company, warehouse, items, ref_type, ref_id, user, allow_expired=False):
    """Sell stock using FEFO; expired batches are blocked unless explicitly allowed."""
    _ensure_company_scope(company, warehouse)
    can_sell_expired = allow_expired or bool(
        getattr(getattr(user, "profile", None), "can_sell_expired", False)
    )
    today = timezone.now().date()
    with transaction.atomic():
        ledger_entries = []
        for item in items:
            product = item["product"]
            if product.company_id != company.id:
                raise serializers.ValidationError("Product does not belong to your company.")
            qty_needed = item["qty"]
            qs = Batch.objects.select_for_update().filter(
                company=company,
                warehouse=warehouse,
                product=product,
                qty_on_hand__gt=0,
            )
            if not can_sell_expired:
                qs = qs.filter(expiry_date__gte=today)
            batches = list(qs.order_by("expiry_date", "id"))
            for batch in batches:
                if qty_needed <= 0:
                    break
                available = batch.qty_on_hand
                if available <= 0:
                    continue
                qty_to_deduct = min(available, qty_needed)
                batch.qty_on_hand = batch.qty_on_hand - qty_to_deduct
                batch.save(update_fields=["qty_on_hand"])
                ledger_entries.append(
                    StockLedger.objects.create(
                        company=company,
                        warehouse=warehouse,
                        product=product,
                        batch=batch,
                        movement_type=StockLedger.MovementType.SALE,
                        qty=qty_to_deduct,
                        unit_cost=batch.purchase_price,
                        ref_type=ref_type,
                        ref_id=ref_id,
                        note="",
                        created_by=user,
                    )
                )
                qty_needed -= qty_to_deduct
            if qty_needed > 0:
                restriction = "non-expired " if not can_sell_expired else ""
                raise serializers.ValidationError(
                    f"Insufficient {restriction}stock for {product.name}."
                )
        return ledger_entries


def return_stock(company, warehouse, items, ref_type, ref_id, user, note=None):
    _ensure_company_scope(company, warehouse)
    with transaction.atomic():
        updated_batches = []
        for item in items:
            batch = Batch.objects.select_for_update().get(id=item["batch"].id)
            if batch.company_id != company.id or batch.warehouse_id != warehouse.id:
                raise serializers.ValidationError("Batch does not belong to your warehouse.")
            qty = item["qty"]
            batch.qty_on_hand = batch.qty_on_hand + qty
            batch.save(update_fields=["qty_on_hand"])
            StockLedger.objects.create(
                company=company,
                warehouse=warehouse,
                product=batch.product,
                batch=batch,
                movement_type=StockLedger.MovementType.RETURN,
                qty=qty,
                unit_cost=batch.purchase_price,
                ref_type=ref_type,
                ref_id=ref_id,
                note=note or "",
                created_by=user,
            )
            updated_batches.append(batch)
        return updated_batches


def transfer_stock(
    company,
    from_warehouse,
    to_warehouse,
    items,
    ref_type,
    ref_id,
    user,
    note=None,
):
    _ensure_company_scope(company, from_warehouse)
    _ensure_company_scope(company, to_warehouse)
    if from_warehouse.id == to_warehouse.id:
        raise serializers.ValidationError("Source and destination warehouses must differ.")
    with transaction.atomic():
        moved_batches = []
        for item in items:
            source_batch = Batch.objects.select_for_update().get(id=item["batch"].id)
            if source_batch.company_id != company.id:
                raise serializers.ValidationError("Batch does not belong to your company.")
            if source_batch.warehouse_id != from_warehouse.id:
                raise serializers.ValidationError("Batch does not belong to source warehouse.")
            qty = item["qty"]
            if source_batch.qty_on_hand < qty:
                raise serializers.ValidationError(
                    f"Insufficient stock in batch {source_batch.batch_no}."
                )
            source_batch.qty_on_hand = source_batch.qty_on_hand - qty
            source_batch.save(update_fields=["qty_on_hand"])
            StockLedger.objects.create(
                company=company,
                warehouse=from_warehouse,
                product=source_batch.product,
                batch=source_batch,
                movement_type=StockLedger.MovementType.OUT,
                qty=qty,
                unit_cost=source_batch.purchase_price,
                ref_type=ref_type,
                ref_id=ref_id,
                note=note or "",
                created_by=user,
            )
            destination_batch, _ = Batch.objects.select_for_update().get_or_create(
                company=company,
                product=source_batch.product,
                warehouse=to_warehouse,
                batch_no=source_batch.batch_no,
                defaults={
                    "expiry_date": source_batch.expiry_date,
                    "purchase_price": source_batch.purchase_price,
                    "selling_price": source_batch.selling_price,
                    "qty_on_hand": Decimal("0"),
                },
            )
            destination_batch.expiry_date = source_batch.expiry_date
            destination_batch.purchase_price = source_batch.purchase_price
            destination_batch.selling_price = source_batch.selling_price
            destination_batch.qty_on_hand = destination_batch.qty_on_hand + qty
            destination_batch.save(
                update_fields=[
                    "expiry_date",
                    "purchase_price",
                    "selling_price",
                    "qty_on_hand",
                ]
            )
            StockLedger.objects.create(
                company=company,
                warehouse=to_warehouse,
                product=source_batch.product,
                batch=destination_batch,
                movement_type=StockLedger.MovementType.IN,
                qty=qty,
                unit_cost=source_batch.purchase_price,
                ref_type=ref_type,
                ref_id=ref_id,
                note=note or "",
                created_by=user,
            )
            moved_batches.append(destination_batch)
        return moved_batches


def adjust_stock(company, warehouse, items, reason, user):
    _ensure_company_scope(company, warehouse)
    with transaction.atomic():
        adjusted_batches = []
        for item in items:
            batch = Batch.objects.select_for_update().get(id=item["batch"].id)
            if batch.company_id != company.id or batch.warehouse_id != warehouse.id:
                raise serializers.ValidationError("Batch does not belong to your warehouse.")
            qty_delta = item["qty"]
            new_qty = batch.qty_on_hand + qty_delta
            if new_qty < 0:
                raise serializers.ValidationError(
                    f"Adjustment would make batch {batch.batch_no} negative."
                )
            batch.qty_on_hand = new_qty
            batch.save(update_fields=["qty_on_hand"])
            StockLedger.objects.create(
                company=company,
                warehouse=warehouse,
                product=batch.product,
                batch=batch,
                movement_type=StockLedger.MovementType.ADJUST,
                qty=qty_delta,
                unit_cost=batch.purchase_price,
                ref_type="ADJUSTMENT",
                ref_id="MANUAL",
                note=reason,
                created_by=user,
            )
            adjusted_batches.append(batch)
        return adjusted_batches
