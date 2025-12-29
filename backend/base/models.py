from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# In your existing UserProfile model (add these fields if not present)
class UserProfile(models.Model):
    """Extended user profile for Kids League Kenya"""
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('beneficiary', 'Beneficiary'),
        ('staff', 'Staff Member'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='beneficiary')
    
    # Personal Information
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    national_id = models.CharField(max_length=20, blank=True, null=True)
    
    # Address Information
    address = models.TextField(blank=True, null=True)
    county = models.CharField(max_length=100, blank=True, null=True)
    constituency = models.CharField(max_length=100, blank=True, null=True)
    
    # School Information
    school = models.CharField(max_length=200, blank=True, null=True)
    grade = models.CharField(max_length=20, blank=True, null=True)
    admission_number = models.CharField(max_length=50, blank=True, null=True)
    school_type = models.CharField(max_length=50, blank=True, null=True)  # e.g., 'boarding', 'day'
    
    # Guardian Information
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_phone = models.CharField(max_length=20, blank=True, null=True)
    guardian_email = models.EmailField(blank=True, null=True)
    guardian_relationship = models.CharField(max_length=50, blank=True, null=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Profile Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    verification_level = models.IntegerField(default=0)  # 0-3 scale
    
    # Sponsorship Information
    sponsorship_status = models.CharField(max_length=50, default='active')  # active, conditional, suspended, completed
    sponsorship_start_date = models.DateField(blank=True, null=True)
    sponsorship_end_date = models.DateField(blank=True, null=True)
    
    # Profile Image
    profile_image = models.ImageField(upload_to='profile_images/%Y/%m/%d/', null=True, blank=True)
    
    # Timestamps
    registration_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        ordering = ['-registration_date']
    
    def __str__(self):
        return f"{self.user.email} - {self.role}"
    
    @property
    def full_name(self):
        """Get user's full name"""
        full_name = f"{self.user.first_name} {self.user.last_name}".strip()
        return full_name or self.user.username
    
    @property
    def email(self):
        """Get user's email"""
        return self.user.email
    
    @property
    def years_in_program(self):
        """Calculate years in sponsorship program"""
        if self.sponsorship_start_date:
            from datetime import date
            today = date.today()
            years = today.year - self.sponsorship_start_date.year
            if today.month < self.sponsorship_start_date.month or (
                today.month == self.sponsorship_start_date.month and 
                today.day < self.sponsorship_start_date.day
            ):
                years -= 1
            return max(years, 0)
        return 0
    
    @property
    def is_currently_sponsored(self):
        """Check if user is currently sponsored"""
        if not self.sponsorship_start_date:
            return False
        
        from datetime import date
        today = date.today()
        
        if self.sponsorship_status == 'active':
            if self.sponsorship_end_date:
                return today <= self.sponsorship_end_date
            return True
        
        return self.sponsorship_status == 'conditional'

class LoginHistory(models.Model):
    """Track user login history"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    login_time = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    successful = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.login_time}"
    
    class Meta:
        verbose_name = "Login History"
        verbose_name_plural = "Login History"
        ordering = ['-login_time']

class PasswordResetToken(models.Model):
    """Store password reset tokens"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.email} - {self.created_at}"
    
    class Meta:
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"

# Signal to create user profile when a new user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Document(models.Model):
    DOCUMENT_TYPES = [
        ('fee_statement', 'Fee Statement'),
        ('receipt', 'Receipt'),
        ('report_card', 'Report Card'),
        ('medical', 'Medical Certificate'),
        ('id_card', 'ID Card'),
        ('birth_certificate', 'Birth Certificate'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('requires_action', 'Requires Action'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='documents/%Y/%m/%d/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.name} - {self.user.email}"
    
    class Meta:
        ordering = ['-uploaded_at']

class Deadline(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['due_date']
    
    def __str__(self):
        return self.title

class AcademicPerformance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='academic_records')
    term = models.CharField(max_length=50)
    year = models.IntegerField()
    gpa = models.DecimalField(max_digits=3, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(4)])
    class_rank = models.IntegerField()
    total_students = models.IntegerField()
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-year', 'term']
        unique_together = ['user', 'term', 'year']
    
    def __str__(self):
        return f"{self.user.username} - {self.term} {self.year}"

class Message(models.Model):
    """Message model for communication between users"""
    MESSAGE_TYPES = [
        ('general', 'General Inquiry'),
        ('financial', 'Financial Aid'),
        ('academic', 'Academic'),
        ('document', 'Document Related'),
        ('technical', 'Technical Support'),
        ('other', 'Other'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    
    # Message content
    subject = models.CharField(max_length=200)
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='general')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # Status tracking
    is_read = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_deleted_by_sender = models.BooleanField(default=False)
    is_deleted_by_recipient = models.BooleanField(default=False)
    
    # Timestamps
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # For replies/threads
    parent_message = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    is_reply = models.BooleanField(default=False)
    
    # Attachments (optional)
    attachments = models.FileField(upload_to='message_attachments/%Y/%m/%d/', null=True, blank=True)
    
    class Meta:
        ordering = ['-sent_at']
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        indexes = [
            models.Index(fields=['sender', 'sent_at']),
            models.Index(fields=['recipient', 'is_read', 'sent_at']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.sender.email} to {self.recipient.email}"
    
    def mark_as_read(self):
        """Mark message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def mark_as_unread(self):
        """Mark message as unread"""
        self.is_read = False
        self.read_at = None
        self.save()
    
    def archive(self):
        """Archive the message"""
        self.is_archived = True
        self.save()
    
    def unarchive(self):
        """Unarchive the message"""
        self.is_archived = False
        self.save()
    
    def delete_for_user(self, user):
        """Soft delete for a specific user"""
        if user == self.sender:
            self.is_deleted_by_sender = True
        elif user == self.recipient:
            self.is_deleted_by_recipient = True
        self.save()
        
        # If both users have deleted it, delete permanently
        if self.is_deleted_by_sender and self.is_deleted_by_recipient:
            self.delete()
    
    @property
    def is_active_for_sender(self):
        """Check if message is visible to sender"""
        return not self.is_deleted_by_sender
    
    @property
    def is_active_for_recipient(self):
        """Check if message is visible to recipient"""
        return not self.is_deleted_by_recipient
    
    @property
    def time_since_sent(self):
        """Get human readable time since message was sent"""
        from django.utils.timesince import timesince
        return timesince(self.sent_at)
    
    @property
    def is_high_priority(self):
        """Check if message is high priority"""
        return self.priority in ['high', 'urgent']
    
    def reply(self, sender, content, subject=None):
        """Create a reply to this message"""
        if not subject:
            subject = f"Re: {self.subject}"
        
        reply = Message.objects.create(
            sender=sender,
            recipient=self.sender if sender == self.recipient else self.recipient,
            subject=subject,
            content=content,
            parent_message=self,
            is_reply=True,
            message_type=self.message_type,
            priority=self.priority
        )
        return reply

class FinancialAid(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('suspended', 'Suspended'),
        ('completed', 'Completed'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='financial_aid')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    amount_awarded = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.status}"

class FeeStatement(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('paid', 'Fully Paid'),
        ('partial', 'Partial Payment'),
        ('unpaid', 'Unpaid'),
        ('overdue', 'Overdue'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fee_statements')
    term = models.CharField(max_length=50)
    year = models.IntegerField()
    school = models.CharField(max_length=200)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    statement_file = models.FileField(upload_to='fee_statements/%Y/%m/%d/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-year', 'term']
        unique_together = ['user', 'term', 'year']
        verbose_name = "Fee Statement"
        verbose_name_plural = "Fee Statements"
    
    def __str__(self):
        return f"{self.term} {self.year} - {self.user.username}"
    
    @property
    def balance(self):
        return self.total_amount - self.amount_paid
    
    @property
    def payment_percentage(self):
        if self.total_amount > 0:
            return (self.amount_paid / self.total_amount) * 100
        return 0
    
    @property
    def is_overdue(self):
        """Check if fee statement is overdue"""
        from django.utils import timezone
        return timezone.now().date() > self.due_date
    
    def update_status(self):
        """Update status based on payments"""
        if self.amount_paid >= self.total_amount:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        elif self.is_overdue:
            self.status = 'overdue'
        else:
            self.status = 'unpaid'
        self.save()
    
    def add_payment(self, payment):
        """Add a payment to this fee statement"""
        if payment.fee_statement and payment.fee_statement != self:
            raise ValueError("Payment already associated with another fee statement")
        
        payment.fee_statement = self
        payment.save()
        
        # Update amount paid
        self.amount_paid += payment.amount
        self.update_status()


class Payment(models.Model):
    """Payment model for tracking all payments made by beneficiaries"""
    PAYMENT_METHODS = [
        ('mpesa', 'M-Pesa'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('mobile_banking', 'Mobile Banking'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('disputed', 'Disputed'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments', null=True)
    fee_statement = models.ForeignKey('FeeStatement', on_delete=models.SET_NULL, null=True, blank=True, related_name='statement_payments')
    
    # Payment Information
    receipt_number = models.CharField(max_length=50, unique=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    
    # For reporting/filtering
    term = models.CharField(max_length=50, null=True)
    year = models.IntegerField(null=True)
    
    # Additional details
    description = models.TextField(blank=True, null=True)
    receipt_file = models.FileField(upload_to='receipts/%Y/%m/%d/', null=True, blank=True)
    
    # Verification status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified = models.BooleanField(default=False)  # Legacy field for backward compatibility
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_payments')
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date', '-created_at']
        verbose_name = "Payment Receipt"
        verbose_name_plural = "Payment Receipts"
    
    def __str__(self):
        return f"{self.receipt_number} - KES {self.amount} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        # Auto-generate receipt number if not provided
        if not self.receipt_number:
            from django.db.models import Max
            max_id = Payment.objects.aggregate(max_id=Max('id'))['max_id'] or 0
            self.receipt_number = f"RCP-{self.year}-{str(max_id + 1).zfill(4)}"
        
        # Sync verified status with status field
        if self.status == 'verified':
            self.verified = True
            if not self.verified_at:
                self.verified_at = timezone.now()
        else:
            self.verified = False
        
        super().save(*args, **kwargs)
    
    @property
    def status_display(self):
        """Get human-readable status"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    @property
    def payment_method_display(self):
        """Get human-readable payment method"""
        return dict(self.PAYMENT_METHODS).get(self.payment_method, self.payment_method)
    
    @property
    def is_overdue(self):
        """Check if payment is overdue (if related to fee statement)"""
        if self.fee_statement and self.fee_statement.due_date:
            return self.payment_date > self.fee_statement.due_date
        return False
    
    def mark_as_verified(self, verified_by=None, notes=''):
        """Helper method to mark payment as verified"""
        self.status = 'verified'
        self.verified = True
        self.verified_by = verified_by
        self.verified_at = timezone.now()
        self.verification_notes = notes
        self.save()
        
        # Update fee statement if exists
        if self.fee_statement:
            self.fee_statement.amount_paid += self.amount
            if self.fee_statement.balance <= 0:
                self.fee_statement.status = 'paid'
            else:
                self.fee_statement.status = 'partial'
            self.fee_statement.save()
    
    def mark_as_rejected(self, notes=''):
        """Helper method to mark payment as rejected"""
        self.status = 'rejected'
        self.verified = False
        self.verification_notes = notes
        self.save()


class AcademicRecord(models.Model):
    """Academic performance records for beneficiaries"""
    GRADE_CHOICES = [
        ('A', 'A (75-100%)'),
        ('A-', 'A- (70-74%)'),
        ('B+', 'B+ (65-69%)'),
        ('B', 'B (60-64%)'),
        ('B-', 'B- (55-59%)'),
        ('C+', 'C+ (50-54%)'),
        ('C', 'C (45-49%)'),
        ('C-', 'C- (40-44%)'),
        ('D+', 'D+ (35-39%)'),
        ('D', 'D (30-34%)'),
        ('D-', 'D- (25-29%)'),
        ('E', 'E (0-24%)'),
    ]
    
    SUBJECT_CHOICES = [
        ('mathematics', 'Mathematics'),
        ('english', 'English'),
        ('kiswahili', 'Kiswahili'),
        ('physics', 'Physics'),
        ('chemistry', 'Chemistry'),
        ('biology', 'Biology'),
        ('history', 'History'),
        ('geography', 'Geography'),
        ('cre', 'CRE'),
        ('ire', 'IRE'),
        ('hre', 'HRE'),
        ('computer', 'Computer Studies'),
        ('business', 'Business Studies'),
        ('agriculture', 'Agriculture'),
        ('home_science', 'Home Science'),
        ('art', 'Art & Design'),
        ('music', 'Music'),
        ('physical_education', 'Physical Education'),
        ('foreign_language', 'Foreign Language'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='academic_records')
    term = models.CharField(max_length=50)
    year = models.IntegerField()
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    marks = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES)
    points = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    teacher = models.CharField(max_length=100, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    report_card = models.FileField(upload_to='report_cards/%Y/%m/%d/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', 'term', 'subject']
        unique_together = ['user', 'term', 'year', 'subject']
        verbose_name = "Academic Record"
        verbose_name_plural = "Academic Records"
    
    def __str__(self):
        return f"{self.user.username} - {self.subject} - {self.term} {self.year}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate grade if not provided
        if not self.grade:
            self.grade = self.calculate_grade()
        
        # Auto-calculate points if not provided
        if not self.points:
            self.points = self.calculate_points()
        
        super().save(*args, **kwargs)
    
    def calculate_grade(self):
        """Calculate grade based on marks"""
        marks = float(self.marks)
        if marks >= 75:
            return 'A'
        elif marks >= 70:
            return 'A-'
        elif marks >= 65:
            return 'B+'
        elif marks >= 60:
            return 'B'
        elif marks >= 55:
            return 'B-'
        elif marks >= 50:
            return 'C+'
        elif marks >= 45:
            return 'C'
        elif marks >= 40:
            return 'C-'
        elif marks >= 35:
            return 'D+'
        elif marks >= 30:
            return 'D'
        elif marks >= 25:
            return 'D-'
        else:
            return 'E'
    
    def calculate_points(self):
        """Calculate points based on grade"""
        grade_points = {
            'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
            'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3,
            'D-': 2, 'E': 1
        }
        return grade_points.get(self.grade, 1)

class AcademicSummary(models.Model):
    """Summary of academic performance per term"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='academic_summaries')
    term = models.CharField(max_length=50)
    year = models.IntegerField()
    average_score = models.DecimalField(max_digits=5, decimal_places=2)
    average_grade = models.CharField(max_length=2)
    total_points = models.IntegerField()
    mean_grade = models.CharField(max_length=5)  # e.g., "B+"
    class_rank = models.IntegerField()
    total_students = models.IntegerField()
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', 'term']
        unique_together = ['user', 'term', 'year']
        verbose_name = "Academic Summary"
        verbose_name_plural = "Academic Summaries"
    
    def __str__(self):
        return f"{self.user.username} - {self.term} {self.year} - Avg: {self.average_score}%"
    
    @property
    def grade_points(self):
        """Calculate total grade points"""
        return self.total_points
    
    @property
    def is_current(self):
        """Check if this is the current term"""
        from django.utils import timezone
        current_year = timezone.now().year
        return self.year == current_year and self.term in ['Term 1', 'Term 2', 'Term 3']


# Change AcademicPerformance model
class AcademicPerformance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='academic_performances')  # CHANGED
    term = models.CharField(max_length=50)
    year = models.IntegerField()
    gpa = models.DecimalField(max_digits=3, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(4)])
    class_rank = models.IntegerField()
    total_students = models.IntegerField()
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-year', 'term']
        unique_together = ['user', 'term', 'year']
    
    def __str__(self):
        return f"{self.user.username} - {self.term} {self.year}"


from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

# Education Level Model
class EducationLevel(models.Model):
    """Education level categories (pre-school, primary, secondary, etc.)"""
    LEVEL_CHOICES = [
        ('pre_school', 'Pre-School'),
        ('primary', 'Primary'),
        ('secondary', 'Secondary'),
        ('university', 'University/College'),
        ('vocational', 'Vocational'),
    ]
    
    level_key = models.CharField(max_length=50, choices=LEVEL_CHOICES, unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon_name = models.CharField(max_length=50, default='school')  # For Lucide React icons
    color_gradient = models.CharField(max_length=100, default='from-blue-500 to-cyan-500')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = "Education Level"
        verbose_name_plural = "Education Levels"
    
    def __str__(self):
        return self.title
    
    @property
    def total_students(self):
        """Get total students in this education level"""
        return self.students.filter(education_level=self).count()
    
    @property
    def active_students(self):
        """Get active students in this education level"""
        return self.students.filter(
            education_level=self,
            sponsorship_status='active'
        ).count()

class GradeClass(models.Model):
    """Grade/Class within an education level"""
    education_level = models.ForeignKey(EducationLevel, on_delete=models.CASCADE, related_name='grades')
    name = models.CharField(max_length=100)  # e.g., "Grade 1", "Form 1", "Year 1"
    short_code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['education_level', 'order']
        verbose_name = "Grade/Class"
        verbose_name_plural = "Grades/Classes"
        unique_together = ['education_level', 'name']
    
    def __str__(self):
        return f"{self.education_level.title} - {self.name}"

# Update UserProfile model to include education level and grade
class UserProfile(models.Model):
    """Extended user profile for Kids League Kenya"""
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('beneficiary', 'Beneficiary'),
        ('staff', 'Staff Member'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    # Education level and grade fields
    education_level = models.ForeignKey(EducationLevel, on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='students')
    grade_class = models.ForeignKey(GradeClass, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='students')
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='beneficiary')
    
    # Personal Information
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    national_id = models.CharField(max_length=20, blank=True, null=True)
    
    # Address Information
    address = models.TextField(blank=True, null=True)
    county = models.CharField(max_length=100, blank=True, null=True)
    constituency = models.CharField(max_length=100, blank=True, null=True)
    
    # School Information
    school = models.CharField(max_length=200, blank=True, null=True)
    admission_number = models.CharField(max_length=50, blank=True, null=True)
    school_type = models.CharField(max_length=50, blank=True, null=True)
    
    # Guardian Information
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_phone = models.CharField(max_length=20, blank=True, null=True)
    guardian_email = models.EmailField(blank=True, null=True)
    guardian_relationship = models.CharField(max_length=50, blank=True, null=True)
    
    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Profile Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    verification_level = models.IntegerField(default=0)
    
    # Sponsorship Information
    sponsorship_status = models.CharField(max_length=50, default='active')
    sponsorship_start_date = models.DateField(blank=True, null=True)
    sponsorship_end_date = models.DateField(blank=True, null=True)
    
    # Profile Image
    profile_image = models.ImageField(upload_to='profile_images/%Y/%m/%d/', null=True, blank=True)
    
    # Academic performance cache for quick access
    current_average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    current_attendance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Timestamps
    registration_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        ordering = ['-registration_date']
        indexes = [
            models.Index(fields=['education_level', 'grade_class']),
            models.Index(fields=['sponsorship_status']),
            models.Index(fields=['county']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.role}"
    
    @property
    def full_name(self):
        """Get user's full name"""
        full_name = f"{self.user.first_name} {self.user.last_name}".strip()
        return full_name or self.user.username
    
    @property
    def email(self):
        """Get user's email"""
        return self.user.email
    
    @property
    def years_in_program(self):
        """Calculate years in sponsorship program"""
        if self.sponsorship_start_date:
            from datetime import date
            today = date.today()
            years = today.year - self.sponsorship_start_date.year
            if today.month < self.sponsorship_start_date.month or (
                today.month == self.sponsorship_start_date.month and 
                today.day < self.sponsorship_start_date.day
            ):
                years -= 1
            return max(years, 0)
        return 0
    
    @property
    def is_currently_sponsored(self):
        """Check if user is currently sponsored"""
        if not self.sponsorship_start_date:
            return False
        
        from datetime import date
        today = date.today()
        
        if self.sponsorship_status == 'active':
            if self.sponsorship_end_date:
                return today <= self.sponsorship_end_date
            return True
        
        return self.sponsorship_status == 'conditional'
    
    @property
    def grade_name(self):
        """Get grade name for display"""
        if self.grade_class:
            return self.grade_class.name
        return self.grade or "Not Assigned"
    
    def update_academic_stats(self):
        """Update cached academic statistics"""
        from django.db.models import Avg
        latest_summary = AcademicSummary.objects.filter(user=self.user).order_by('-year', '-term').first()
        if latest_summary:
            self.current_average_score = latest_summary.average_score
            self.current_attendance = latest_summary.attendance_percentage
            self.save()

# Education Level Statistics Model
class EducationLevelStats(models.Model):
    """Statistics for education levels (cached for performance)"""
    education_level = models.OneToOneField(EducationLevel, on_delete=models.CASCADE, related_name='stats')
    
    # Student statistics
    total_students = models.IntegerField(default=0)
    active_students = models.IntegerField(default=0)
    pending_verification = models.IntegerField(default=0)
    new_this_month = models.IntegerField(default=0)
    
    # Academic statistics
    average_performance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passing_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Financial statistics
    total_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_aid_disbursed = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Document statistics
    pending_documents = models.IntegerField(default=0)
    approved_documents = models.IntegerField(default=0)
    
    # Update timestamp
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Education Level Statistics"
        verbose_name_plural = "Education Level Statistics"
    
    def __str__(self):
        return f"{self.education_level.title} Statistics"
    
    def update_statistics(self):
        """Update all statistics for this education level"""
        from django.db.models import Sum, Count, Avg, Q
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        
        # Student counts
        profiles = UserProfile.objects.filter(
            education_level=self.education_level,
            role='beneficiary'
        )
        
        self.total_students = profiles.count()
        self.active_students = profiles.filter(sponsorship_status='active').count()
        self.pending_verification = profiles.filter(is_verified=False).count()
        self.new_this_month = profiles.filter(
            registration_date__gte=current_month_start
        ).count()
        
        # Academic performance (average of latest academic summaries)
        user_ids = profiles.values_list('user_id', flat=True)
        latest_summaries = AcademicSummary.objects.filter(
            user_id__in=user_ids
        ).order_by('user_id', '-year', '-term').distinct('user_id')
        
        if latest_summaries.exists():
            self.average_performance = latest_summaries.aggregate(
                avg=Avg('average_score')
            )['avg'] or 0
            
            # Calculate passing rate (students with >= 40% average)
            passing_students = latest_summaries.filter(
                average_score__gte=40
            ).count()
            if latest_summaries.count() > 0:
                self.passing_rate = (passing_students / latest_summaries.count()) * 100
        
        # Financial statistics
        fee_stats = FeeStatement.objects.filter(
            user_id__in=user_ids
        ).aggregate(
            total_fees=Sum('total_amount'),
            total_paid=Sum('amount_paid')
        )
        self.total_fees = fee_stats['total_fees'] or 0
        self.total_paid = fee_stats['total_paid'] or 0
        
        aid_stats = Payment.objects.filter(
            user_id__in=user_ids,
            status='verified'
        ).aggregate(total=Sum('amount'))
        self.total_aid_disbursed = aid_stats['total'] or 0
        
        # Document statistics
        self.pending_documents = Document.objects.filter(
            user_id__in=user_ids,
            status='pending'
        ).count()
        self.approved_documents = Document.objects.filter(
            user_id__in=user_ids,
            status='approved'
        ).count()
        
        self.save()

# Grade Statistics Model
class GradeStats(models.Model):
    """Statistics for individual grades"""
    grade_class = models.OneToOneField(GradeClass, on_delete=models.CASCADE, related_name='stats')
    total_students = models.IntegerField(default=0)
    male_students = models.IntegerField(default=0)
    female_students = models.IntegerField(default=0)
    average_performance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    average_attendance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Grade Statistics"
        verbose_name_plural = "Grade Statistics"
    
    def __str__(self):
        return f"{self.grade_class.name} Statistics"
    
    def update_statistics(self):
        """Update grade statistics"""
        profiles = UserProfile.objects.filter(grade_class=self.grade_class)
        
        self.total_students = profiles.count()
        self.male_students = profiles.filter(gender='male').count()
        self.female_students = profiles.filter(gender='female').count()
        
        # Calculate average performance
        user_ids = profiles.values_list('user_id', flat=True)
        latest_summaries = AcademicSummary.objects.filter(
            user_id__in=user_ids
        ).order_by('user_id', '-year', '-term').distinct('user_id')
        
        if latest_summaries.exists():
            avg_stats = latest_summaries.aggregate(
                avg_performance=Avg('average_score'),
                avg_attendance=Avg('attendance_percentage')
            )
            self.average_performance = avg_stats['avg_performance'] or 0
            self.average_attendance = avg_stats['avg_attendance'] or 0
        
        self.save()

# Keep other models (Document, Message, FeeStatement, Payment, AcademicRecord, etc.)
# ... [Keep all your existing models like Document, Message, FeeStatement, Payment, AcademicRecord, AcademicSummary, etc.] ...

# Add signals to update education level statistics
@receiver(post_save, sender=UserProfile)
def update_education_stats_on_profile_change(sender, instance, **kwargs):
    """Update education level statistics when profile changes"""
    if instance.education_level:
        stats, created = EducationLevelStats.objects.get_or_create(
            education_level=instance.education_level
        )
        stats.update_statistics()
    
    if instance.grade_class:
        grade_stats, created = GradeStats.objects.get_or_create(
            grade_class=instance.grade_class
        )
        grade_stats.update_statistics()

@receiver(post_save, sender=AcademicSummary)
def update_education_stats_on_academic_change(sender, instance, **kwargs):
    """Update education level statistics when academic performance changes"""
    try:
        profile = UserProfile.objects.get(user=instance.user)
        if profile.education_level:
            stats, created = EducationLevelStats.objects.get_or_create(
                education_level=profile.education_level
            )
            stats.update_statistics()
        
        # Update user's cached academic stats
        profile.update_academic_stats()
        
    except UserProfile.DoesNotExist:
        pass

@receiver(post_save, sender=Payment)
@receiver(post_save, sender=Document)
@receiver(post_save, sender=FeeStatement)
def update_education_stats_on_related_change(sender, instance, **kwargs):
    """Update education level statistics when related records change"""
    try:
        profile = UserProfile.objects.get(user=instance.user)
        if profile.education_level:
            stats, created = EducationLevelStats.objects.get_or_create(
                education_level=profile.education_level
            )
            stats.update_statistics()
    except (UserProfile.DoesNotExist, AttributeError):
        pass