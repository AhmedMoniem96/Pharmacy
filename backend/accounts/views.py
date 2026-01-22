from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
import uuid


User = get_user_model()

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import UserProfileSerializer
        from .models import ensure_user_profile

        profile = getattr(request.user, "profile", None)
        if not profile:
            profile = ensure_user_profile(request.user)

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        from .serializers import UserProfileUpdateSerializer, UserProfileSerializer
        from .models import ensure_user_profile

        profile = getattr(request.user, "profile", None)
        if not profile:
            profile = ensure_user_profile(request.user)

        serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InviteTeammateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .serializers import InviteTeammateSerializer
        from .models import ensure_user_profile, UserProfile

        serializer = InviteTeammateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        full_name = serializer.validated_data.get("full_name", "")
        role = serializer.validated_data.get("role") or "STAFF"

        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "A user with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        base_username = email.split("@")[0]
        username = base_username
        if User.objects.filter(username=username).exists():
            username = f"{base_username}-{uuid.uuid4().hex[:6]}"

        invited_user = User.objects.create_user(username=username, email=email)
        invited_user.set_unusable_password()
        invited_user.first_name = full_name
        invited_user.save()

        inviter_profile = getattr(request.user, "profile", None)
        if not inviter_profile:
            inviter_profile = ensure_user_profile(request.user)

        UserProfile.objects.create(
            user=invited_user,
            company=inviter_profile.company,
            role=role,
        )

        return Response({"detail": "Invitation sent."}, status=status.HTTP_201_CREATED)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        from .serializers import RegisterSerializer
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "User registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TokenObtainPairRateLimitedView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_token"
