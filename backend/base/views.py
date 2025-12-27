import json
import jwt
from datetime import datetime, timedelta 
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.db import transaction
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re
from django.db.models import Sum, Count, Q, Avg


# Import models
from .models import UserProfile, LoginHistory

# JWT Configuration
JWT_SECRET = getattr(settings, 'JWT_SECRET', settings.SECRET_KEY)
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def generate_jwt_token(user):
    """Generate JWT token for user"""
    payload = {
        'user_id': user.id,
        'email': user.email,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow(),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        return token.decode('utf-8')
    return token

def verify_jwt_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return "Password must contain at least one number"
    return None

@csrf_exempt
def api_login(request):
    """Handle user login with JWT"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
            
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not email or not password:
            return JsonResponse({
                'success': False,
                'error': 'Email and password are required'
            }, status=400)
        
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid email format'
            }, status=400)
        
        # Find user by email or username
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=email)
            except User.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid email or password'
                }, status=401)
        
        # Authenticate
        user = authenticate(username=user.username, password=password)
        
        if user is not None and user.is_active:
            # Get or create user profile for role
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'beneficiary'}
            )
            
            # Record login history
            try:
                ip_address = request.META.get('REMOTE_ADDR', '')
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                LoginHistory.objects.create(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    successful=True
                )
            except Exception as e:
                print(f"Failed to record login history: {e}")
            
            # Generate JWT token
            token = generate_jwt_token(user)
            
            return JsonResponse({
                'success': True,
                'token': token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'role': profile.role,
                    'is_admin': user.is_staff or user.is_superuser
                }
            })
        else:
            # Record failed login attempt
            try:
                ip_address = request.META.get('REMOTE_ADDR', '')
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                # Try to find the user for logging purposes
                try:
                    failed_user = User.objects.get(email=email)
                except User.DoesNotExist:
                    try:
                        failed_user = User.objects.get(username=email)
                    except User.DoesNotExist:
                        failed_user = None
                
                if failed_user:
                    LoginHistory.objects.create(
                        user=failed_user,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        successful=False
                    )
            except Exception as e:
                print(f"Failed to record failed login: {e}")
            
            return JsonResponse({
                'success': False,
                'error': 'Invalid email or password'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        import traceback
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred'
        }, status=500)

@csrf_exempt
def api_signup(request):
    """Handle user registration"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
            
        data = json.loads(request.body)
        full_name = data.get('fullName', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        confirm_password = data.get('confirmPassword', '')
        
        # Validation
        if not all([full_name, email, password, confirm_password]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        # Email validation
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid email format'
            }, status=400)
        
        # Name validation
        if len(full_name) < 2:
            return JsonResponse({
                'success': False,
                'error': 'Full name must be at least 2 characters'
            }, status=400)
        
        # Password validation
        if password != confirm_password:
            return JsonResponse({
                'success': False,
                'error': 'Passwords do not match'
            }, status=400)
        
        password_error = validate_password(password)
        if password_error:
            return JsonResponse({
                'success': False,
                'error': password_error
            }, status=400)
        
        # Check if user exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'error': 'Email already registered'
            }, status=409)
        
        if User.objects.filter(username=email).exists():
            return JsonResponse({
                'success': False,
                'error': 'Username already exists'
            }, status=409)
        
        # Split full name
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Create user
        with transaction.atomic():
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_staff=False,
                is_superuser=False
            )
            
            # Get the user profile (created automatically by signal)
            profile = UserProfile.objects.get(user=user)
            
            # Generate JWT token
            token = generate_jwt_token(user)
            
            # Record first login/signup
            try:
                ip_address = request.META.get('REMOTE_ADDR', '')
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                LoginHistory.objects.create(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    successful=True
                )
            except Exception as e:
                print(f"Failed to record signup history: {e}")
            
            return JsonResponse({
                'success': True,
                'token': token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'full_name': full_name,
                    'role': profile.role,
                    'is_admin': False
                },
                'message': 'Account created successfully'
            })
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        import traceback
        print(f"Signup error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'An unexpected error occurred: {str(e)}'
        }, status=500)

@csrf_exempt
def api_logout(request):
    """Handle user logout"""
    # For JWT, we don't need server-side logout, but we invalidate on client
    return JsonResponse({
        'success': True,
        'message': 'Logged out successfully'
    })

@csrf_exempt
def api_validate_token(request):
    """Validate JWT token and get user info"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        user = User.objects.get(id=payload['user_id'])
        
        # Get user profile for role
        try:
            profile = UserProfile.objects.get(user=user)
            role = profile.role
        except UserProfile.DoesNotExist:
            # Create profile if it doesn't exist (for users created before profiles)
            profile = UserProfile.objects.create(user=user, role='beneficiary')
            role = 'beneficiary'
        
        is_admin = user.is_staff or user.is_superuser
        
        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'role': role,
                'is_admin': is_admin
            }
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Token validation error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred'
        }, status=500)

@csrf_exempt
def api_change_password(request):
    """Change user password"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
            
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        data = json.loads(request.body)
        current_password = data.get('currentPassword', '')
        new_password = data.get('newPassword', '')
        confirm_password = data.get('confirmPassword', '')
        
        if not all([current_password, new_password, confirm_password]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        if new_password != confirm_password:
            return JsonResponse({
                'success': False,
                'error': 'New passwords do not match'
            }, status=400)
        
        user = User.objects.get(id=payload['user_id'])
        
        # Verify current password
        if not user.check_password(current_password):
            return JsonResponse({
                'success': False,
                'error': 'Current password is incorrect'
            }, status=401)
        
        # Validate new password
        password_error = validate_password(new_password)
        if password_error:
            return JsonResponse({
                'success': False,
                'error': password_error
            }, status=400)
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Generate new token
        new_token = generate_jwt_token(user)
        
        return JsonResponse({
            'success': True,
            'token': new_token,
            'message': 'Password updated successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Password change error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred'
        }, status=500)

@csrf_exempt
def api_get_user_profile(request):
    """Get detailed user profile"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        user = User.objects.get(id=payload['user_id'])
        
        # Get user profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='beneficiary')
        
        return JsonResponse({
            'success': True,
            'profile': {
                'user_id': user.id,
                'email': user.email,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'role': profile.role,
                'is_admin': user.is_staff or user.is_superuser,
                'phone_number': profile.phone_number,
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'is_verified': profile.is_verified,
                'registration_date': profile.registration_date.isoformat(),
                'guardian_name': profile.guardian_name,
                'guardian_phone': profile.guardian_phone,
                'school': profile.school,
                'grade': profile.grade
            }
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Profile fetch error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred'
        }, status=500)

@csrf_exempt
def api_update_profile(request):
    """Update user profile"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
            
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        data = json.loads(request.body)
        user = User.objects.get(id=payload['user_id'])
        
        # Get user profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='beneficiary')
        
        # Update user fields if provided
        if 'full_name' in data:
            full_name = data['full_name'].strip()
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.save()
        
        # Update profile fields
        if 'phone_number' in data:
            profile.phone_number = data['phone_number'].strip()
        if 'guardian_name' in data:
            profile.guardian_name = data['guardian_name'].strip()
        if 'guardian_phone' in data:
            profile.guardian_phone = data['guardian_phone'].strip()
        if 'school' in data:
            profile.school = data['school'].strip()
        if 'grade' in data:
            profile.grade = data['grade'].strip()
        
        profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': {
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'phone_number': profile.phone_number,
                'guardian_name': profile.guardian_name,
                'guardian_phone': profile.guardian_phone,
                'school': profile.school,
                'grade': profile.grade
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Profile update error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred'
        }, status=500)

@csrf_exempt
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'authentication',
        'timestamp': datetime.datetime.now().isoformat(),
        'user_count': User.objects.count(),
        'profile_count': UserProfile.objects.count()
    })



import json
from datetime import datetime, timedelta
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q, Avg
from django.core.paginator import Paginator
from .models import *

@csrf_exempt
def portal_dashboard(request):
    """Get dashboard data for authenticated user"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get user's full name
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        
        # Calculate stats
        documents_total = Document.objects.filter(user=user).count()
        documents_pending = Document.objects.filter(user=user, status='pending').count()
        documents_approved = Document.objects.filter(user=user, status='approved').count()
        documents_action = Document.objects.filter(user=user, status='requires_action').count()
        
        # Get recent documents (last 5)
        recent_docs = Document.objects.filter(user=user).order_by('-uploaded_at')[:5]
        
        # Get upcoming deadlines (next 30 days)
        today = datetime.now().date()
        thirty_days_later = today + timedelta(days=30)
        deadlines = Deadline.objects.filter(
            due_date__range=[today, thirty_days_later],
            is_active=True
        ).order_by('due_date')[:5]
        
        # Get latest academic performance
        academic_record = AcademicPerformance.objects.filter(user=user).order_by('-year', '-term').first()
        
        # Get financial aid status
        try:
            financial_aid = FinancialAid.objects.get(user=user)
            financial_status = financial_aid.status
        except FinancialAid.DoesNotExist:
            financial_status = 'pending'
        
        # Get unread message count
        unread_messages = Message.objects.filter(recipient=user, is_read=False).count()
        
        return JsonResponse({
            'success': True,
            'dashboard': {
                'user': {
                    'full_name': full_name,
                    'email': user.email
                },
                'stats': {
                    'documents_submitted': documents_total,
                    'pending_approval': documents_pending,
                    'approved': documents_approved,
                    'action_required': documents_action,
                    'unread_messages': unread_messages
                },
                'recent_documents': [
                    {
                        'id': doc.id,
                        'name': doc.name,
                        'type': doc.document_type,
                        'status': doc.status,
                        'uploaded_at': doc.uploaded_at.isoformat(),
                        'reviewer_notes': doc.reviewer_notes if doc.reviewer_notes else None
                    } for doc in recent_docs
                ],
                'upcoming_deadlines': [
                    {
                        'id': deadline.id,
                        'title': deadline.title,
                        'description': deadline.description,
                        'due_date': deadline.due_date.isoformat(),
                        'days_left': (deadline.due_date - today).days
                    } for deadline in deadlines
                ],
                'academic_performance': {
                    'gpa': str(academic_record.gpa) if academic_record else None,
                    'class_rank': academic_record.class_rank if academic_record else None,
                    'total_students': academic_record.total_students if academic_record else None,
                    'attendance_percentage': str(academic_record.attendance_percentage) if academic_record else None,
                    'term': academic_record.term if academic_record else None,
                    'year': academic_record.year if academic_record else None
                },
                'financial_aid_status': financial_status
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Dashboard error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to load dashboard data'
        }, status=500)

@csrf_exempt
def upload_document(request):
    """Handle document upload"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Handle file upload
        if 'file' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No file uploaded'
            }, status=400)
        
        file = request.FILES['file']
        document_type = request.POST.get('document_type', 'other')
        name = request.POST.get('name', file.name)
        
        # Validate file size (max 10MB)
        if file.size > 10 * 1024 * 1024:
            return JsonResponse({
                'success': False,
                'error': 'File size too large. Maximum size is 10MB'
            }, status=400)
        
        # Validate file type
        allowed_types = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
        file_extension = file.name.split('.')[-1].lower()
        if file_extension not in allowed_types:
            return JsonResponse({
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join(allowed_types)}'
            }, status=400)
        
        # Create document record
        document = Document.objects.create(
            user=user,
            name=name,
            document_type=document_type,
            file=file,
            status='pending'
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Document uploaded successfully',
            'document': {
                'id': document.id,
                'name': document.name,
                'type': document.document_type,
                'status': document.status,
                'uploaded_at': document.uploaded_at.isoformat()
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to upload document'
        }, status=500)

@csrf_exempt
def get_documents(request):
    """Get user's documents with pagination"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        status_filter = request.GET.get('status', None)
        search = request.GET.get('search', '')
        
        # Build query
        query = Q(user=user)
        if status_filter:
            query &= Q(status=status_filter)
        if search:
            query &= Q(name__icontains=search)
        
        # Get documents
        documents = Document.objects.filter(query).order_by('-uploaded_at')
        
        # Paginate
        paginator = Paginator(documents, limit)
        page_obj = paginator.get_page(page)
        
        return JsonResponse({
            'success': True,
            'documents': [
                {
                    'id': doc.id,
                    'name': doc.name,
                    'type': doc.document_type,
                    'status': doc.status,
                    'uploaded_at': doc.uploaded_at.isoformat(),
                    'reviewed_at': doc.reviewed_at.isoformat() if doc.reviewed_at else None,
                    'reviewer_notes': doc.reviewer_notes,
                    'file_url': doc.file.url if doc.file else None
                } for doc in page_obj
            ],
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Get documents error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch documents'
        }, status=500)

@csrf_exempt
def get_messages(request):
    """Get user's messages"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get messages
        messages = Message.objects.filter(recipient=user).order_by('-sent_at')[:20]
        
        return JsonResponse({
            'success': True,
            'messages': [
                {
                    'id': msg.id,
                    'subject': msg.subject,
                    'content': msg.content,
                    'sender': {
                        'email': msg.sender.email,
                        'full_name': f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username
                    },
                    'is_read': msg.is_read,
                    'sent_at': msg.sent_at.isoformat()
                } for msg in messages
            ],
            'unread_count': Message.objects.filter(recipient=user, is_read=False).count()
        })
        
    except Exception as e:
        import traceback
        print(f"Get messages error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch messages'
        }, status=500)

@csrf_exempt
def send_message(request):
    """Send a message to admin"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Parse request data
        data = json.loads(request.body)
        subject = data.get('subject', '')
        content = data.get('content', '')
        
        if not subject or not content:
            return JsonResponse({
                'success': False,
                'error': 'Subject and content are required'
            }, status=400)
        
        # Find an admin user
        try:
            admin_user = User.objects.filter(is_staff=True).first()
            if not admin_user:
                admin_user = User.objects.filter(is_superuser=True).first()
        except:
            admin_user = None
        
        if not admin_user:
            return JsonResponse({
                'success': False,
                'error': 'No admin user found'
            }, status=404)
        
        # Create message
        message = Message.objects.create(
            sender=user,
            recipient=admin_user,
            subject=subject,
            content=content
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Message sent successfully',
            'message_id': message.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        import traceback
        print(f"Send message error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to send message'
        }, status=500)

@csrf_exempt
def mark_message_read(request, message_id):
    """Mark a message as read"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get message
        try:
            message = Message.objects.get(id=message_id, recipient=user)
        except Message.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Message not found'
            }, status=404)
        
        # Mark as read
        message.is_read = True
        message.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Message marked as read'
        })
        
    except Exception as e:
        import traceback
        print(f"Mark message read error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to update message'
        }, status=500)

@csrf_exempt
def delete_document(request, document_id):
    """Delete a document"""
    try:
        if request.method != 'DELETE':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get document
        try:
            document = Document.objects.get(id=document_id, user=user)
        except Document.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Document not found or access denied'
            }, status=404)
        
        # Only allow deletion of pending documents
        if document.status != 'pending':
            return JsonResponse({
                'success': False,
                'error': 'Only pending documents can be deleted'
            }, status=400)
        
        # Delete the file and record
        document.file.delete()
        document.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Document deleted successfully'
        })
        
    except Exception as e:
        import traceback
        print(f"Delete document error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to delete document'
        }, status=500)

@csrf_exempt
def get_document_types(request):
    """Get available document types"""
    return JsonResponse({
        'success': True,
        'document_types': [
            {'value': 'fee_statement', 'label': 'Fee Statement'},
            {'value': 'receipt', 'label': 'Receipt'},
            {'value': 'report_card', 'label': 'Report Card'},
            {'value': 'medical', 'label': 'Medical Certificate'},
            {'value': 'id_card', 'label': 'ID Card'},
            {'value': 'birth_certificate', 'label': 'Birth Certificate'},
            {'value': 'other', 'label': 'Other'},
        ]
    })

@csrf_exempt
def download_document(request, document_id):
    """Download a document"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get document
        try:
            document = Document.objects.get(id=document_id, user=user)
        except Document.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Document not found or access denied'
            }, status=404)
        
        # Check if file exists
        if not document.file:
            return JsonResponse({
                'success': False,
                'error': 'File not found'
            }, status=404)
        
        # Serve file
        response = FileResponse(document.file, as_attachment=True, filename=document.name)
        return response
        
    except Exception as e:
        import traceback
        print(f"Download error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to download document'
        }, status=500)

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os

@csrf_exempt
def api_upload_document(request):
    """Handle document upload with improved validation"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Check if file is present
        if 'file' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No file uploaded'
            }, status=400)
        
        file = request.FILES['file']
        
        # Get form data
        document_type = request.POST.get('document_type', 'other')
        name = request.POST.get('name', '').strip()
        description = request.POST.get('description', '').strip()
        
        # Validation
        if not name:
            name = file.name
        
        if not document_type:
            return JsonResponse({
                'success': False,
                'error': 'Document type is required'
            }, status=400)
        
        # Validate document type
        valid_types = ['fee_statement', 'receipt', 'report_card', 'medical', 
                      'id_card', 'birth_certificate', 'other']
        if document_type not in valid_types:
            return JsonResponse({
                'success': False,
                'error': 'Invalid document type'
            }, status=400)
        
        # Validate file size (max 10MB)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        if file.size > MAX_FILE_SIZE:
            return JsonResponse({
                'success': False,
                'error': f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB'
            }, status=400)
        
        # Validate file extension
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
        file_name = file.name.lower()
        file_extension = os.path.splitext(file_name)[1]
        
        if file_extension not in allowed_extensions:
            return JsonResponse({
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join([ext for ext in allowed_extensions if ext])}'
            }, status=400)
        
        # Generate unique filename
        import uuid
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save file with unique name
        file_path = default_storage.save(f'documents/{user.id}/{unique_filename}', ContentFile(file.read()))
        
        # Create document record
        with transaction.atomic():
            document = Document.objects.create(
                user=user,
                name=name,
                document_type=document_type,
                file=file_path,
                status='pending',
                reviewer_notes=description if description else None
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Document uploaded successfully',
            'document': {
                'id': document.id,
                'name': document.name,
                'type': document.document_type,
                'status': document.status,
                'uploaded_at': document.uploaded_at.isoformat(),
                'file_url': request.build_absolute_uri(document.file.url) if document.file else None
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Failed to upload document: {str(e)}'
        }, status=500)


from .models import FeeStatement, Payment
from datetime import datetime, timedelta
from decimal import Decimal

@csrf_exempt
def get_fee_statements(request):
    """Get user's fee statements"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        year = request.GET.get('year', None)
        status_filter = request.GET.get('status', None)
        
        # Build query
        query = Q(user=user)
        if year:
            query &= Q(year=year)
        if status_filter:
            query &= Q(status=status_filter)
        
        # Get fee statements
        statements = FeeStatement.objects.filter(query).order_by('-year', '-term')
        
        # Paginate
        paginator = Paginator(statements, limit)
        page_obj = paginator.get_page(page)
        
        # Calculate summary statistics
        current_year = datetime.now().year
        current_year_statements = statements.filter(year=current_year)
        
        total_fees = current_year_statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        total_paid = current_year_statements.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
        total_balance = total_fees - total_paid
        
        # Calculate percentage paid
        payment_percentage = 0
        if total_fees > 0:
            payment_percentage = (total_paid / total_fees) * 100
        
        # Get payment percentage change (compare with previous year)
        previous_year = current_year - 1
        prev_year_statements = statements.filter(year=previous_year)
        prev_year_total = prev_year_statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        fees_change = 0
        if prev_year_total > 0:
            fees_change = ((total_fees - prev_year_total) / prev_year_total) * 100
        
        return JsonResponse({
            'success': True,
            'statements': [
                {
                    'id': st.id,
                    'term': st.term,
                    'year': st.year,
                    'school': st.school,
                    'total_amount': str(st.total_amount),
                    'amount_paid': str(st.amount_paid),
                    'balance': str(st.balance),
                    'due_date': st.due_date.isoformat(),
                    'status': st.status,
                    'payment_percentage': float(st.payment_percentage),
                    'statement_file': st.statement_file.url if st.statement_file else None,
                    'notes': st.notes,
                    'created_at': st.created_at.isoformat()
                } for st in page_obj
            ],
            'summary_stats': {
                'total_fees': str(total_fees),
                'total_paid': str(total_paid),
                'total_balance': str(total_balance),
                'payment_percentage': float(payment_percentage),
                'fees_change': float(fees_change)
            },
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Get fee statements error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch fee statements'
        }, status=500)

@csrf_exempt
def get_statement_summary(request):
    """Get fee statement summary for dashboard"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get current year statements
        current_year = datetime.now().year
        statements = FeeStatement.objects.filter(user=user, year=current_year)
        
        # Calculate statistics
        total_fees = statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        total_paid = statements.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
        total_balance = total_fees - total_paid
        
        # Get outstanding statements
        outstanding_statements = statements.filter(status__in=['partial', 'unpaid', 'overdue'])
        
        # Calculate days until next due date
        today = datetime.now().date()
        upcoming_statements = statements.filter(due_date__gte=today, status__in=['partial', 'unpaid']).order_by('due_date')
        
        next_due_date = upcoming_statements.first().due_date if upcoming_statements.exists() else None
        days_until_due = (next_due_date - today).days if next_due_date else None
        
        return JsonResponse({
            'success': True,
            'summary': {
                'total_fees': str(total_fees),
                'total_paid': str(total_paid),
                'total_balance': str(total_balance),
                'payment_percentage': float((total_paid / total_fees * 100) if total_fees > 0 else 0),
                'outstanding_count': outstanding_statements.count(),
                'next_due_date': next_due_date.isoformat() if next_due_date else None,
                'days_until_due': days_until_due
            },
            'outstanding_statements': [
                {
                    'id': st.id,
                    'term': st.term,
                    'year': st.year,
                    'balance': str(st.balance),
                    'due_date': st.due_date.isoformat(),
                    'days_overdue': (today - st.due_date).days if st.due_date < today else 0
                } for st in outstanding_statements[:5]
            ]
        })
        
    except Exception as e:
        import traceback
        print(f"Statement summary error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch statement summary'
        }, status=500)

@csrf_exempt
def upload_fee_statement(request):
    """Upload a fee statement"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Parse form data
        term = request.POST.get('term', '').strip()
        year = request.POST.get('year', '').strip()
        school = request.POST.get('school', '').strip()
        total_amount = request.POST.get('total_amount', '').strip()
        due_date = request.POST.get('due_date', '').strip()
        
        # Validate required fields
        if not all([term, year, school, total_amount, due_date]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        try:
            year_int = int(year)
            total_amount_dec = Decimal(total_amount)
            due_date_obj = datetime.strptime(due_date, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'error': 'Invalid data format'
            }, status=400)
        
        # Check if statement already exists
        if FeeStatement.objects.filter(user=user, term=term, year=year_int).exists():
            return JsonResponse({
                'success': False,
                'error': f'Fee statement for {term} {year_int} already exists'
            }, status=409)
        
        # Handle file upload
        statement_file = request.FILES.get('statement_file', None)
        
        # Create fee statement
        with transaction.atomic():
            fee_statement = FeeStatement.objects.create(
                user=user,
                term=term,
                year=year_int,
                school=school,
                total_amount=total_amount_dec,
                due_date=due_date_obj,
                status='pending',
                statement_file=statement_file
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Fee statement uploaded successfully',
            'statement': {
                'id': fee_statement.id,
                'term': fee_statement.term,
                'year': fee_statement.year,
                'school': fee_statement.school,
                'total_amount': str(fee_statement.total_amount),
                'due_date': fee_statement.due_date.isoformat(),
                'status': fee_statement.status
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Upload fee statement error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Failed to upload fee statement: {str(e)}'
        }, status=500)

@csrf_exempt
def download_statement(request, statement_id):
    """Download fee statement file"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get fee statement
        try:
            statement = FeeStatement.objects.get(id=statement_id, user=user)
        except FeeStatement.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Statement not found or access denied'
            }, status=404)
        
        # Check if file exists
        if not statement.statement_file:
            return JsonResponse({
                'success': False,
                'error': 'No file attached to this statement'
            }, status=404)
        
        # Serve file
        response = FileResponse(statement.statement_file, as_attachment=True, 
                               filename=f"fee_statement_{statement.term}_{statement.year}.pdf")
        return response
        
    except Exception as e:
        import traceback
        print(f"Download statement error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to download statement'
        }, status=500)

@csrf_exempt
def get_years(request):
    """Get distinct years from fee statements"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get distinct years
        years = FeeStatement.objects.filter(user=user).values_list('year', flat=True).distinct().order_by('-year')
        
        return JsonResponse({
            'success': True,
            'years': list(years)
        })
        
    except Exception as e:
        import traceback
        print(f"Get years error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch years'
        }, status=500)


from .models import Payment
import uuid

@csrf_exempt
def get_payments(request):
    """Get user's payment receipts"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        year = request.GET.get('year', None)
        status_filter = request.GET.get('status', None)
        payment_method = request.GET.get('payment_method', None)
        
        # Build query
        query = Q(user=user)
        if year:
            query &= Q(year=year)
        if status_filter:
            query &= Q(status=status_filter)
        if payment_method and payment_method != 'all':
            query &= Q(payment_method=payment_method)
        
        # Get payments
        payments = Payment.objects.filter(query).order_by('-payment_date')
        
        # Calculate summary statistics
        verified_payments = payments.filter(status='verified')
        total_paid = verified_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        current_year = datetime.now().year
        current_year_payments = payments.filter(year=current_year)
        current_year_total = current_year_payments.filter(status='verified').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Get payment methods
        payment_methods = payments.values_list('payment_method', flat=True).distinct()
        
        # Paginate
        paginator = Paginator(payments, limit)
        page_obj = paginator.get_page(page)
        
        return JsonResponse({
            'success': True,
            'payments': [
                {
                    'id': payment.id,
                    'receipt_number': payment.receipt_number,
                    'amount': str(payment.amount),
                    'payment_date': payment.payment_date.isoformat(),
                    'payment_method': payment.get_payment_method_display(),
                    'payment_method_value': payment.payment_method,
                    'term': payment.term,
                    'year': payment.year,
                    'description': payment.description,
                    'status': payment.status,
                    'status_display': payment.get_status_display(),
                    'verification_notes': payment.verification_notes,
                    'verified_at': payment.verified_at.isoformat() if payment.verified_at else None,
                    'receipt_file': payment.receipt_file.url if payment.receipt_file else None,
                    'created_at': payment.created_at.isoformat()
                } for payment in page_obj
            ],
            'summary_stats': {
                'total_paid': str(total_paid),
                'current_year_total': str(current_year_total),
                'verified_count': verified_payments.count(),
                'pending_count': payments.filter(status='pending').count(),
                'payment_methods': list(payment_methods)
            },
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Get payments error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch payment receipts'
        }, status=500)

@csrf_exempt
def upload_receipt(request):
    """Upload a payment receipt"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Parse form data
        amount = request.POST.get('amount', '').strip()
        payment_date = request.POST.get('payment_date', '').strip()
        payment_method = request.POST.get('payment_method', '').strip()
        term = request.POST.get('term', '').strip()
        year = request.POST.get('year', '').strip()
        description = request.POST.get('description', '').strip()
        
        # Validate required fields
        if not all([amount, payment_date, payment_method, term, year]):
            return JsonResponse({
                'success': False,
                'error': 'Amount, date, payment method, term, and year are required'
            }, status=400)
        
        try:
            amount_dec = Decimal(amount)
            year_int = int(year)
            payment_date_obj = datetime.strptime(payment_date, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'error': 'Invalid data format'
            }, status=400)
        
        # Validate amount
        if amount_dec <= 0:
            return JsonResponse({
                'success': False,
                'error': 'Amount must be greater than zero'
            }, status=400)
        
        # Validate payment method
        valid_methods = ['mpesa', 'bank_transfer', 'cash', 'cheque', 'mobile_banking', 'other']
        if payment_method not in valid_methods:
            return JsonResponse({
                'success': False,
                'error': 'Invalid payment method'
            }, status=400)
        
        # Handle file upload
        receipt_file = request.FILES.get('receipt_file', None)
        
        if not receipt_file:
            return JsonResponse({
                'success': False,
                'error': 'Receipt file is required'
            }, status=400)
        
        # Validate file size (max 5MB)
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        if receipt_file.size > MAX_FILE_SIZE:
            return JsonResponse({
                'success': False,
                'error': f'File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB'
            }, status=400)
        
        # Validate file extension
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
        file_name = receipt_file.name.lower()
        file_extension = os.path.splitext(file_name)[1]
        
        if file_extension not in allowed_extensions:
            return JsonResponse({
                'success': False,
                'error': f'File type not allowed. Allowed types: {", ".join([ext for ext in allowed_extensions if ext])}'
            }, status=400)
        
        # Generate unique filename
        import uuid
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Save file with unique name
        file_path = default_storage.save(f'receipts/{user.id}/{unique_filename}', ContentFile(receipt_file.read()))
        
        # Create payment record
        with transaction.atomic():
            payment = Payment.objects.create(
                user=user,
                amount=amount_dec,
                payment_date=payment_date_obj,
                payment_method=payment_method,
                term=term,
                year=year_int,
                description=description,
                receipt_file=file_path,
                status='pending'
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Receipt uploaded successfully',
            'payment': {
                'id': payment.id,
                'receipt_number': payment.receipt_number,
                'amount': str(payment.amount),
                'payment_date': payment.payment_date.isoformat(),
                'payment_method': payment.get_payment_method_display(),
                'term': payment.term,
                'year': payment.year,
                'status': payment.status
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Upload receipt error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Failed to upload receipt: {str(e)}'
        }, status=500)

@csrf_exempt
def download_receipt(request, payment_id):
    """Download receipt file"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get payment
        try:
            payment = Payment.objects.get(id=payment_id, user=user)
        except Payment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Payment not found or access denied'
            }, status=404)
        
        # Check if file exists
        if not payment.receipt_file:
            return JsonResponse({
                'success': False,
                'error': 'No receipt file attached'
            }, status=404)
        
        # Serve file
        filename = f"receipt_{payment.receipt_number}{os.path.splitext(payment.receipt_file.name)[1]}"
        response = FileResponse(payment.receipt_file, as_attachment=True, filename=filename)
        return response
        
    except Exception as e:
        import traceback
        print(f"Download receipt error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to download receipt'
        }, status=500)

@csrf_exempt
def get_payment_methods(request):
    """Get available payment methods"""
    return JsonResponse({
        'success': True,
        'payment_methods': [
            {'value': 'mpesa', 'label': 'M-Pesa'},
            {'value': 'bank_transfer', 'label': 'Bank Transfer'},
            {'value': 'cash', 'label': 'Cash'},
            {'value': 'cheque', 'label': 'Cheque'},
            {'value': 'mobile_banking', 'label': 'Mobile Banking'},
            {'value': 'other', 'label': 'Other'},
        ]
    })

@csrf_exempt
def get_payment_summary(request):
    """Get payment summary for dashboard"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get current year payments
        current_year = datetime.now().year
        payments = Payment.objects.filter(user=user, year=current_year)
        
        # Calculate statistics
        verified_payments = payments.filter(status='verified')
        total_paid = verified_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Get payment distribution by method
        payment_distribution = verified_payments.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        return JsonResponse({
            'success': True,
            'summary': {
                'total_paid': str(total_paid),
                'verified_count': verified_payments.count(),
                'pending_count': payments.filter(status='pending').count(),
                'payment_distribution': [
                    {
                        'method': item['payment_method'],
                        'method_display': dict(Payment.PAYMENT_METHODS).get(item['payment_method'], item['payment_method']),
                        'total': str(item['total']),
                        'count': item['count']
                    } for item in payment_distribution
                ]
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Payment summary error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch payment summary'
        }, status=500)

from .models import AcademicRecord, AcademicSummary
from decimal import Decimal

@csrf_exempt
def get_academic_summary(request):
    """Get academic summary for current user"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get current term summary
        current_year = datetime.now().year
        current_term = 'Term 1'  # You can make this dynamic based on current date
        
        try:
            current_summary = AcademicSummary.objects.get(
                user=user, 
                year=current_year, 
                term=current_term
            )
        except AcademicSummary.DoesNotExist:
            current_summary = None
        
        # Get current term grades
        current_grades = AcademicRecord.objects.filter(
            user=user, 
            year=current_year, 
            term=current_term
        ).order_by('subject')
        
        # Get all academic summaries for history
        all_summaries = AcademicSummary.objects.filter(
            user=user
        ).order_by('-year', 'term')[:10]
        
        # Calculate best subject
        best_subject = None
        if current_grades.exists():
            best_subject_record = current_grades.order_by('-marks').first()
            best_subject = {
                'subject': best_subject_record.get_subject_display(),
                'marks': float(best_subject_record.marks),
                'grade': best_subject_record.grade
            }
        
        # Get overall statistics
        all_records = AcademicRecord.objects.filter(user=user)
        overall_average = 0
        if all_records.exists():
            total_marks = sum(float(record.marks) for record in all_records)
            overall_average = total_marks / all_records.count()
        
        return JsonResponse({
            'success': True,
            'current_summary': {
                'term': current_summary.term if current_summary else current_term,
                'year': current_summary.year if current_summary else current_year,
                'average_score': float(current_summary.average_score) if current_summary else 0,
                'average_grade': current_summary.average_grade if current_summary else 'N/A',
                'mean_grade': current_summary.mean_grade if current_summary else 'N/A',
                'class_rank': current_summary.class_rank if current_summary else 0,
                'total_students': current_summary.total_students if current_summary else 0,
                'attendance_percentage': float(current_summary.attendance_percentage) if current_summary else 0,
                'grade_points': current_summary.grade_points if current_summary else 0,
                'is_current': True,
                'remarks': current_summary.remarks if current_summary else None
            } if current_summary else None,
            'current_grades': [
                {
                    'id': grade.id,
                    'subject': grade.get_subject_display(),
                    'subject_value': grade.subject,
                    'marks': float(grade.marks),
                    'grade': grade.grade,
                    'grade_display': grade.get_grade_display(),
                    'points': grade.points,
                    'teacher': grade.teacher,
                    'remarks': grade.remarks
                } for grade in current_grades
            ],
            'academic_history': [
                {
                    'id': summary.id,
                    'term': summary.term,
                    'year': summary.year,
                    'average_score': float(summary.average_score),
                    'average_grade': summary.average_grade,
                    'mean_grade': summary.mean_grade,
                    'class_rank': summary.class_rank,
                    'total_students': summary.total_students,
                    'attendance_percentage': float(summary.attendance_percentage),
                    'is_current': summary.is_current,
                    'remarks': summary.remarks
                } for summary in all_summaries
            ],
            'performance_stats': {
                'overall_average': float(overall_average),
                'best_subject': best_subject,
                'total_subjects': current_grades.count(),
                'grade_distribution': {
                    'A': current_grades.filter(grade='A').count(),
                    'A-': current_grades.filter(grade='A-').count(),
                    'B+': current_grades.filter(grade='B+').count(),
                    'B': current_grades.filter(grade='B').count(),
                    'B-': current_grades.filter(grade='B-').count(),
                    'other': current_grades.filter(grade__in=['C+', 'C', 'C-', 'D+', 'D', 'D-', 'E']).count()
                }
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Get academic summary error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch academic records'
        }, status=500)

@csrf_exempt
def get_subject_history(request, subject):
    """Get history for a specific subject"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get subject history
        subject_records = AcademicRecord.objects.filter(
            user=user,
            subject=subject
        ).order_by('-year', 'term')
        
        if not subject_records.exists():
            return JsonResponse({
                'success': False,
                'error': 'No records found for this subject'
            }, status=404)
        
        # Calculate subject statistics
        marks_history = [float(record.marks) for record in subject_records]
        average_marks = sum(marks_history) / len(marks_history)
        
        # Get grade trend
        grade_trend = []
        for record in subject_records:
            grade_trend.append({
                'term': record.term,
                'year': record.year,
                'marks': float(record.marks),
                'grade': record.grade,
                'grade_display': record.get_grade_display(),
                'teacher': record.teacher
            })
        
        return JsonResponse({
            'success': True,
            'subject': dict(AcademicRecord.SUBJECT_CHOICES).get(subject, subject),
            'subject_value': subject,
            'average_marks': average_marks,
            'highest_marks': max(marks_history),
            'lowest_marks': min(marks_history),
            'total_terms': len(marks_history),
            'grade_trend': grade_trend,
            'current_record': {
                'marks': float(subject_records.first().marks),
                'grade': subject_records.first().grade,
                'grade_display': subject_records.first().get_grade_display(),
                'teacher': subject_records.first().teacher
            } if subject_records.exists() else None
        })
        
    except Exception as e:
        import traceback
        print(f"Get subject history error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch subject history'
        }, status=500)

@csrf_exempt
def get_grade_guide(request):
    """Get grade guide information"""
    return JsonResponse({
        'success': True,
        'grade_guide': [
            {'grade': 'A', 'range': '75-100%', 'points': 12, 'description': 'Excellent'},
            {'grade': 'A-', 'range': '70-74%', 'points': 11, 'description': 'Very Good'},
            {'grade': 'B+', 'range': '65-69%', 'points': 10, 'description': 'Good Plus'},
            {'grade': 'B', 'range': '60-64%', 'points': 9, 'description': 'Good'},
            {'grade': 'B-', 'range': '55-59%', 'points': 8, 'description': 'Fairly Good'},
            {'grade': 'C+', 'range': '50-54%', 'points': 7, 'description': 'Average Plus'},
            {'grade': 'C', 'range': '45-49%', 'points': 6, 'description': 'Average'},
            {'grade': 'C-', 'range': '40-44%', 'points': 5, 'description': 'Below Average'},
            {'grade': 'D+', 'range': '35-39%', 'points': 4, 'description': 'Marginal Pass'},
            {'grade': 'D', 'range': '30-34%', 'points': 3, 'description': 'Pass'},
            {'grade': 'D-', 'range': '25-29%', 'points': 2, 'description': 'Weak Pass'},
            {'grade': 'E', 'range': '0-24%', 'points': 1, 'description': 'Fail'},
        ]
    })

@csrf_exempt
def download_report_card(request, summary_id):
    """Download report card file"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get academic summary
        try:
            summary = AcademicSummary.objects.get(id=summary_id, user=user)
        except AcademicSummary.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Academic summary not found or access denied'
            }, status=404)
        
        # Check if report card exists
        if not summary.report_card:
            return JsonResponse({
                'success': False,
                'error': 'No report card file available'
            }, status=404)
        
        # Serve file
        filename = f"report_card_{summary.term}_{summary.year}.pdf"
        response = FileResponse(summary.report_card, as_attachment=True, filename=filename)
        return response
        
    except Exception as e:
        import traceback
        print(f"Download report card error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to download report card'
        }, status=500)

@csrf_exempt
def get_messages(request):
    """Get user's messages"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get messages (received messages)
        messages = Message.objects.filter(recipient=user).order_by('-sent_at')
        
        # Get sent messages (optional, if you want to show sent messages)
        sent_messages = Message.objects.filter(sender=user).order_by('-sent_at')
        
        # Combine both (you can adjust this based on your needs)
        all_messages = []
        
        for msg in messages:
            all_messages.append({
                'id': msg.id,
                'subject': msg.subject,
                'content': msg.content,
                'sender': {
                    'email': msg.sender.email,
                    'full_name': f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username
                },
                'recipient': {
                    'email': msg.recipient.email,
                    'full_name': f"{msg.recipient.first_name} {msg.recipient.last_name}".strip() or msg.recipient.username
                },
                'is_read': msg.is_read,
                'sent_at': msg.sent_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'messages': all_messages,
            'unread_count': messages.filter(is_read=False).count()
        })
        
    except Exception as e:
        import traceback
        print(f"Get messages error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch messages'
        }, status=500)

@csrf_exempt
def send_message(request):
    """Send a message to admin"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Parse request data
        data = json.loads(request.body)
        subject = data.get('subject', '').strip()
        content = data.get('content', '').strip()
        recipient_type = data.get('recipient_type', 'admin')  # admin, financial, academic, support
        
        if not subject or not content:
            return JsonResponse({
                'success': False,
                'error': 'Subject and content are required'
            }, status=400)
        
        # Find appropriate recipient based on recipient_type
        admin_user = None
        
        # You might want to create a mapping of recipient types to actual users
        # For now, we'll find any admin user
        if recipient_type == 'admin':
            admin_user = User.objects.filter(is_staff=True, is_superuser=False).first()
        elif recipient_type == 'financial':
            # Find financial aid staff
            admin_user = User.objects.filter(
                is_staff=True,
                profile__role__icontains='finance'
            ).first()
        elif recipient_type == 'academic':
            # Find academic staff
            admin_user = User.objects.filter(
                is_staff=True,
                profile__role__icontains='academic'
            ).first()
        elif recipient_type == 'support':
            # Find support staff
            admin_user = User.objects.filter(
                is_staff=True,
                profile__role__icontains='support'
            ).first()
        
        # Fallback to any admin if specific type not found
        if not admin_user:
            admin_user = User.objects.filter(is_staff=True).first()
            if not admin_user:
                admin_user = User.objects.filter(is_superuser=True).first()
        
        if not admin_user:
            return JsonResponse({
                'success': False,
                'error': 'No recipient found for this message type'
            }, status=404)
        
        # Create message
        message = Message.objects.create(
            sender=user,
            recipient=admin_user,
            subject=subject,
            content=content
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Message sent successfully',
            'message_id': message.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        import traceback
        print(f"Send message error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to send message'
        }, status=500)

@csrf_exempt
def mark_message_read(request, message_id):
    """Mark a message as read"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get message
        try:
            message = Message.objects.get(id=message_id, recipient=user)
        except Message.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Message not found'
            }, status=404)
        
        # Mark as read
        message.is_read = True
        message.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Message marked as read'
        })
        
    except Exception as e:
        import traceback
        print(f"Mark message read error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to update message'
        }, status=500)

@csrf_exempt
def delete_message(request, message_id):
    """Delete a message (soft delete or permanent)"""
    try:
        if request.method != 'DELETE':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get message (user can delete messages they sent or received)
        try:
            message = Message.objects.get(
                Q(id=message_id) & (Q(sender=user) | Q(recipient=user))
            )
        except Message.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Message not found or access denied'
            }, status=404)
        
        # Delete the message
        message.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Message deleted successfully'
        })
        
    except Exception as e:
        import traceback
        print(f"Delete message error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to delete message'
        }, status=500)


@csrf_exempt
def api_get_user_profile(request):
    """Get detailed user profile"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get user profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='beneficiary')
        
        return JsonResponse({
            'success': True,
            'profile': {
                'user_id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'role': profile.role,
                'is_admin': user.is_staff or user.is_superuser,
                
                # Personal Information
                'phone_number': profile.phone_number,
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'gender': profile.gender,
                'national_id': profile.national_id,
                
                # Address Information
                'address': profile.address,
                'county': profile.county,
                'constituency': profile.constituency,
                
                # School Information
                'school': profile.school,
                'grade': profile.grade,
                'admission_number': profile.admission_number,
                'school_type': profile.school_type,
                
                # Guardian Information
                'guardian_name': profile.guardian_name,
                'guardian_phone': profile.guardian_phone,
                'guardian_email': profile.guardian_email,
                'guardian_relationship': profile.guardian_relationship,
                
                # Emergency Contact
                'emergency_contact_name': profile.emergency_contact_name,
                'emergency_contact_phone': profile.emergency_contact_phone,
                
                # Profile Status
                'is_verified': profile.is_verified,
                'verification_level': profile.verification_level,
                
                # Sponsorship Information
                'sponsorship_status': profile.sponsorship_status,
                'sponsorship_start_date': profile.sponsorship_start_date.isoformat() if profile.sponsorship_start_date else None,
                'sponsorship_end_date': profile.sponsorship_end_date.isoformat() if profile.sponsorship_end_date else None,
                'years_in_program': profile.years_in_program,
                'is_currently_sponsored': profile.is_currently_sponsored,
                
                # Profile Image
                'profile_image_url': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None,
                
                # Timestamps
                'registration_date': profile.registration_date.isoformat(),
                'last_updated': profile.last_updated.isoformat(),
            }
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Profile fetch error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred'
        }, status=500)

@csrf_exempt
def api_update_profile(request):
    """Update user profile"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
            
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        data = json.loads(request.body)
        user = User.objects.get(id=payload['user_id'])
        
        # Get user profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='beneficiary')
        
        # Update user fields if provided
        if 'full_name' in data:
            full_name = data['full_name'].strip()
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.save()
        
        # Update profile fields
        update_fields = [
            'phone_number', 'date_of_birth', 'gender', 'national_id',
            'address', 'county', 'constituency', 'school', 'grade',
            'admission_number', 'school_type', 'guardian_name',
            'guardian_phone', 'guardian_email', 'guardian_relationship',
            'emergency_contact_name', 'emergency_contact_phone'
        ]
        
        for field in update_fields:
            if field in data:
                setattr(profile, field, data[field] if data[field] else None)
        
        profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully',
            'profile': {
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'phone_number': profile.phone_number,
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'gender': profile.gender,
                'address': profile.address,
                'school': profile.school,
                'grade': profile.grade,
                'admission_number': profile.admission_number,
                'guardian_name': profile.guardian_name,
                'guardian_phone': profile.guardian_phone,
                'guardian_email': profile.guardian_email,
                'guardian_relationship': profile.guardian_relationship,
                'emergency_contact_name': profile.emergency_contact_name,
                'emergency_contact_phone': profile.emergency_contact_phone,
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        import traceback
        print(f"Profile update error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'An unexpected error occurred'
        }, status=500)

@csrf_exempt
def api_upload_profile_image(request):
    """Upload profile image"""
    try:
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get user profile
        try:
            profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='beneficiary')
        
        # Check if image is present
        if 'profile_image' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No image uploaded'
            }, status=400)
        
        image = request.FILES['profile_image']
        
        # Validate image size (max 5MB)
        MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
        if image.size > MAX_FILE_SIZE:
            return JsonResponse({
                'success': False,
                'error': f'Image size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB'
            }, status=400)
        
        # Validate image type
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        file_name = image.name.lower()
        import os
        file_extension = os.path.splitext(file_name)[1]
        
        if file_extension not in allowed_extensions:
            return JsonResponse({
                'success': False,
                'error': f'Image type not allowed. Allowed types: {", ".join([ext for ext in allowed_extensions if ext])}'
            }, status=400)
        
        # Delete old image if exists
        if profile.profile_image:
            profile.profile_image.delete()
        
        # Save new image
        profile.profile_image = image
        profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile image updated successfully',
            'profile_image_url': request.build_absolute_uri(profile.profile_image.url)
        })
        
    except Exception as e:
        import traceback
        print(f"Profile image upload error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': f'Failed to upload profile image: {str(e)}'
        }, status=500)

@csrf_exempt
def api_get_academic_stats(request):
    """Get academic statistics for user"""
    try:
        # Verify JWT token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Invalid authorization header'
            }, status=401)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return JsonResponse({
                'success': False,
                'error': 'Invalid or expired token'
            }, status=401)
        
        from django.contrib.auth.models import User
        user = User.objects.get(id=payload['user_id'])
        
        # Get academic summary
        from django.db.models import Avg, Max, Count
        from .models import AcademicRecord, AcademicSummary
        
        # Calculate statistics from AcademicRecord
        academic_records = AcademicRecord.objects.filter(user=user)
        
        average_score = 0
        best_subject = None
        if academic_records.exists():
            # Average score
            avg_result = academic_records.aggregate(avg_score=Avg('marks'))
            average_score = float(avg_result['avg_score'] or 0)
            
            # Best subject
            best_record = academic_records.order_by('-marks').first()
            best_subject = best_record.get_subject_display() if best_record else None
        
        # Get total terms from AcademicSummary
        total_terms = AcademicSummary.objects.filter(user=user).count()
        
        # Get attendance from latest summary
        latest_summary = AcademicSummary.objects.filter(user=user).order_by('-year', '-term').first()
        attendance_rate = float(latest_summary.attendance_percentage) if latest_summary else 0
        
        return JsonResponse({
            'success': True,
            'academic_stats': {
                'average_score': average_score,
                'total_terms': total_terms,
                'best_subject': best_subject,
                'attendance_rate': attendance_rate,
                'has_records': academic_records.exists(),
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Academic stats error: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch academic statistics'
        }, status=500)