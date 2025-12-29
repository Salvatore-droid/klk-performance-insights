from django.db import models
from django.contrib.auth.models import User
from base.models import *

class AdminDashboardStats(models.Model):
    """Model to cache dashboard statistics for better performance"""
    total_beneficiaries = models.IntegerField(default=0)
    active_students = models.IntegerField(default=0)
    total_aid_disbursed = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_performance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pending_documents = models.IntegerField(default=0)
    pending_payments = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dashboard Statistics"
        verbose_name_plural = "Dashboard Statistics"
    
    def __str__(self):
        return f"Stats updated at {self.updated_at}"

class AdminNotification(models.Model):
    """Admin-specific notifications"""
    NOTIFICATION_TYPES = [
        ('document', 'Document Review'),
        ('payment', 'Payment Verification'),
        ('application', 'New Application'),
        ('system', 'System Alert'),
        ('message', 'New Message'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_notifications')
    created_at = models.DateTimeField(auto_now_add=True)
    related_object_id = models.IntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.username}"

class AuditLog(models.Model):
    """Track admin actions"""
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('verify', 'Verify'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField()
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
    
    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action_type} - {self.model_name}"

class SystemSetting(models.Model):
    """System-wide settings for admin configuration"""
    SETTING_TYPES = [
        ('general', 'General'),
        ('financial', 'Financial'),
        ('academic', 'Academic'),
        ('notification', 'Notification'),
        ('security', 'Security'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='general')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"
    
    def __str__(self):
        return self.key

class CalendarEvent(models.Model):
    """Academic calendar events"""
    EVENT_TYPES = [
        ('academic', 'Academic'),
        ('exam', 'Examination'),
        ('meeting', 'Meeting'),
        ('event', 'School Event'),
        ('holiday', 'Holiday'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='academic')
    location = models.CharField(max_length=200, blank=True, null=True)
    attendees = models.IntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_date']
        verbose_name = "Calendar Event"
        verbose_name_plural = "Calendar Events"
    
    def __str__(self):
        return f"{self.title} - {self.start_date.strftime('%Y-%m-%d')}"

class AcademicTerm(models.Model):
    """Academic terms/semesters"""
    term_name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_date']
        verbose_name = "Academic Term"
        verbose_name_plural = "Academic Terms"
    
    def __str__(self):
        return self.term_name
    
    @property
    def total_weeks(self):
        """Calculate total weeks in term"""
        from datetime import timedelta
        delta = self.end_date - self.start_date
        return (delta.days // 7) + 1
    
    @property
    def current_week(self):
        """Get current week number if term is active"""
        if self.is_active:
            from datetime import date
            today = date.today()
            if self.start_date <= today <= self.end_date:
                delta = today - self.start_date
                return (delta.days // 7) + 1
        return None