=from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserProfileSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response({"detail": "Profile not found."}, status=404)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
