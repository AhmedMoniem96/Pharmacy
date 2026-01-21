from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics

from .serializers import UserProfileSerializer, RegisterSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response({"detail": "Profile not found."}, status=404)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
