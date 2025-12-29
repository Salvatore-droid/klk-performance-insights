from rest_framework import serializers
from django.contrib.auth.models import User
from base.models import UserProfile, Document, FeeStatement, Payment, AcademicSummary

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(source='user.get_full_name', read_only=True)
    beneficiary_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(source='user.get_full_name', read_only=True)
    beneficiary_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'