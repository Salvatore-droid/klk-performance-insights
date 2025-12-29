import json
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Sum, Avg, Q, F
from django.core.paginator import Paginator
from django.db import transaction
from decimal import Decimal
import logging
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

# Import base app utilities
from base.views import verify_jwt_token

# Import models
from .models import (
    EducationLevel, GradeClass, EducationLevelStats, GradeStats,
    UserProfile, Document, FeeStatement, Payment, 
    AcademicRecord, AcademicSummary, Message,
    AdminDashboardStats, AdminNotification, AuditLog, SystemSetting,
    CalendarEvent, AcademicTerm
)

logger = logging.getLogger(__name__)

def verify_admin(request):
    """Verify JWT token and check if user is admin"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None, JsonResponse({
            'success': False,
            'error': 'Invalid authorization header'
        }, status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)
    
    if not payload:
        return None, JsonResponse({
            'success': False,
            'error': 'Invalid or expired token'
        }, status=401)
    
    try:
        user = User.objects.get(id=payload['user_id'])
        
        # Check if user is admin (staff or superuser)
        if not (user.is_staff or user.is_superuser):
            return None, JsonResponse({
                'success': False,
                'error': 'Admin privileges required'
            }, status=403)
        
        return user, None
    
    except User.DoesNotExist:
        return None, JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)

def create_audit_log(user, action_type, model_name, object_id, description, request=None):
    """Helper function to create audit logs"""
    try:
        AuditLog.objects.create(
            user=user,
            action_type=action_type,
            model_name=model_name,
            object_id=object_id,
            description=description,
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT') if request else None
        )
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")

# In your views.py, update the education level views:
@csrf_exempt
def get_education_levels(request):
    """Get all education levels with statistics"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get all active education levels
        education_levels = EducationLevel.objects.filter(is_active=True).order_by('order')
        
        levels_data = []
        for level in education_levels:
            # Get statistics
            stats, _ = EducationLevelStats.objects.get_or_create(education_level=level)
            
            # Get grades for this level
            grades = GradeClass.objects.filter(
                education_level=level,
                is_active=True
            ).order_by('order')
            
            levels_data.append({
                'id': level.id,
                'key': level.level_key,
                'title': level.title,
                'description': level.description,
                'icon_name': level.icon_name,
                'color_gradient': level.color_gradient,
                'order': level.order,
                'is_active': level.is_active,
                'stats': {
                    'total_students': stats.total_students,
                    'active_students': stats.active_students,
                    'average_performance': float(stats.average_performance),
                    'passing_rate': float(stats.passing_rate),
                },
                'grades': [{
                    'id': grade.id,
                    'name': grade.name,
                    'short_code': grade.short_code,
                    'description': grade.description
                } for grade in grades]
            })
        
        return JsonResponse({
            'success': True,
            'education_levels': levels_data
        })
        
    except Exception as e:
        logger.error(f"Get education levels error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch education levels: ' + str(e)
        }, status=500)

@csrf_exempt
def get_education_level_detail(request, level_key):
    """Get detailed information about a specific education level"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get education level
        try:
            level = EducationLevel.objects.get(level_key=level_key, is_active=True)
        except EducationLevel.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Education level not found'
            }, status=404)
        
        # Get statistics
        stats, _ = EducationLevelStats.objects.get_or_create(education_level=level)
        
        # Get grades
        grades = GradeClass.objects.filter(education_level=level, is_active=True).order_by('order')
        
        # Get students in this level
        students = UserProfile.objects.filter(
            education_level=level,
            role='beneficiary'
        ).select_related('user', 'grade_class').order_by('grade_class__order')
        
        # Prepare student statistics by grade
        grade_stats = []
        for grade in grades:
            grade_students = students.filter(grade_class=grade)
            grade_stat, _ = GradeStats.objects.get_or_create(grade_class=grade)
            
            grade_stats.append({
                'grade': {
                    'id': grade.id,
                    'name': grade.name,
                    'short_code': grade.short_code
                },
                'student_count': grade_students.count(),
                'average_performance': float(grade_stat.average_performance),
                'average_attendance': float(grade_stat.average_attendance),
                'male_students': grade_stat.male_students,
                'female_students': grade_stat.female_students
            })
        
        # Recent activities (payments and documents)
        recent_activities = []
        user_ids = students.values_list('user_id', flat=True)
        
        # Recent documents
        recent_docs = Document.objects.filter(
            user_id__in=user_ids
        ).select_related('user').order_by('-uploaded_at')[:5]
        for doc in recent_docs:
            recent_activities.append({
                'id': f"doc_{doc.id}",
                'type': 'document',
                'title': f"Document uploaded: {doc.name}",
                'user': f"{doc.user.first_name} {doc.user.last_name}".strip() or doc.user.username,
                'grade': doc.user.profile.grade_name if hasattr(doc.user, 'profile') else 'N/A',
                'time': doc.uploaded_at.isoformat(),
                'status': doc.status
            })
        
        # Recent payments
        recent_payments = Payment.objects.filter(
            user_id__in=user_ids
        ).select_related('user').order_by('-created_at')[:5]
        for payment in recent_payments:
            recent_activities.append({
                'id': f"pay_{payment.id}",
                'type': 'payment',
                'title': f"Payment submitted: KES {payment.amount}",
                'user': f"{payment.user.first_name} {payment.user.last_name}".strip() or payment.user.username,
                'grade': payment.user.profile.grade_name if hasattr(payment.user, 'profile') else 'N/A',
                'time': payment.created_at.isoformat(),
                'status': payment.status
            })
        
        # Sort by time
        recent_activities.sort(key=lambda x: x['time'], reverse=True)
        recent_activities = recent_activities[:8]
        
        # Performance trends (last 3 academic terms)
        from django.db.models import Subquery, OuterRef
        recent_terms = AcademicSummary.objects.filter(
            user_id__in=user_ids
        ).values('term', 'year').distinct().order_by('-year', '-term')[:3]
        
        performance_trends = []
        for term_data in recent_terms:
            avg_performance = AcademicSummary.objects.filter(
                user_id__in=user_ids,
                term=term_data['term'],
                year=term_data['year']
            ).aggregate(avg=Avg('average_score'))['avg'] or 0
            
            performance_trends.append({
                'term': f"{term_data['term']} {term_data['year']}",
                'average_performance': float(avg_performance)
            })
        
        # County distribution for this level
        county_distribution = students.exclude(
            county__isnull=True
        ).exclude(county='').values('county').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return JsonResponse({
            'success': True,
            'education_level': {
                'id': level.id,
                'key': level.level_key,
                'title': level.title,
                'description': level.description,
                'icon': level.icon_name,
                'color_gradient': level.color_gradient,
                'is_active': level.is_active,
                'order': level.order
            },
            'statistics': {
                'total_students': stats.total_students,
                'active_students': stats.active_students,
                'pending_verification': stats.pending_verification,
                'new_this_month': stats.new_this_month,
                'average_performance': float(stats.average_performance),
                'passing_rate': float(stats.passing_rate),
                'total_fees': float(stats.total_fees),
                'total_paid': float(stats.total_paid),
                'total_aid_disbursed': float(stats.total_aid_disbursed),
                'pending_documents': stats.pending_documents,
                'approved_documents': stats.approved_documents
            },
            'grades': grade_stats,
            'recent_activities': recent_activities,
            'performance_trends': performance_trends,
            'county_distribution': list(county_distribution)
        })
        
    except Exception as e:
        logger.error(f"Get education level detail error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch education level details'
        }, status=500)

@csrf_exempt
def get_grade_students(request, grade_id):
    """Get students in a specific grade/class"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        search = request.GET.get('search', '')
        
        # Get grade
        try:
            grade = GradeClass.objects.get(id=grade_id, is_active=True)
        except GradeClass.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Grade/Class not found'
            }, status=404)
        
        # Build query
        query = Q(grade_class=grade, role='beneficiary')
        
        if search:
            query &= (
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(admission_number__icontains=search) |
                Q(school__icontains=search)
            )
        
        # Get students
        students = UserProfile.objects.filter(query).select_related('user').order_by('user__last_name')
        
        # Get grade statistics
        grade_stats, _ = GradeStats.objects.get_or_create(grade_class=grade)
        
        # Paginate
        paginator = Paginator(students, limit)
        page_obj = paginator.get_page(page)
        
        # Format response
        students_list = []
        for profile in page_obj:
            # Get latest academic performance
            latest_academic = AcademicSummary.objects.filter(
                user=profile.user
            ).order_by('-year', '-term').first()
            
            # Get fee status
            fee_statements = FeeStatement.objects.filter(user=profile.user)
            total_fees = fee_statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            total_paid = fee_statements.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
            balance = total_fees - total_paid
            
            students_list.append({
                'id': profile.user.id,
                'full_name': profile.full_name,
                'email': profile.user.email,
                'phone_number': profile.phone_number,
                'school': profile.school,
                'admission_number': profile.admission_number,
                'gender': profile.gender,
                'county': profile.county,
                'sponsorship_status': profile.sponsorship_status,
                'is_verified': profile.is_verified,
                'registration_date': profile.registration_date.isoformat(),
                'academic_performance': float(latest_academic.average_score) if latest_academic else 0,
                'attendance': float(latest_academic.attendance_percentage) if latest_academic else 0,
                'total_fees': str(total_fees),
                'total_paid': str(total_paid),
                'balance': str(balance),
                'profile_image_url': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
            })
        
        return JsonResponse({
            'success': True,
            'grade': {
                'id': grade.id,
                'name': grade.name,
                'short_code': grade.short_code,
                'description': grade.description,
                'education_level': {
                    'id': grade.education_level.id,
                    'title': grade.education_level.title,
                    'key': grade.education_level.level_key
                }
            },
            'statistics': {
                'total_students': grade_stats.total_students,
                'male_students': grade_stats.male_students,
                'female_students': grade_stats.female_students,
                'average_performance': float(grade_stats.average_performance),
                'average_attendance': float(grade_stats.average_attendance)
            },
            'students': students_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        logger.error(f"Get grade students error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch grade students'
        }, status=500)

@csrf_exempt
def get_education_dashboard(request):
    """Get education dashboard overview"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get all education levels
        education_levels = EducationLevel.objects.filter(is_active=True).order_by('order')
        
        # Overall statistics
        total_students = UserProfile.objects.filter(role='beneficiary').count()
        active_students = UserProfile.objects.filter(role='beneficiary', sponsorship_status='active').count()
        
        # Academic performance across all levels
        all_students = UserProfile.objects.filter(role='beneficiary')
        user_ids = all_students.values_list('user_id', flat=True)
        
        latest_summaries = AcademicSummary.objects.filter(
            user_id__in=user_ids
        ).order_by('user_id', '-year', '-term').distinct('user_id')
        
        overall_average = 0
        if latest_summaries.exists():
            overall_average = latest_summaries.aggregate(
                avg=Avg('average_score')
            )['avg'] or 0
        
        # Prepare level statistics
        level_stats = []
        for level in education_levels:
            stats, _ = EducationLevelStats.objects.get_or_create(education_level=level)
            
            level_stats.append({
                'key': level.level_key,
                'title': level.title,
                'icon': level.icon_name,
                'color_gradient': level.color_gradient,
                'total_students': stats.total_students,
                'active_students': stats.active_students,
                'average_performance': float(stats.average_performance),
                'passing_rate': float(stats.passing_rate)
            })
        
        # Top performing grades
        top_grades = GradeStats.objects.filter(
            grade_class__is_active=True
        ).select_related('grade_class__education_level').order_by('-average_performance')[:5]
        
        top_grades_list = []
        for grade_stat in top_grades:
            top_grades_list.append({
                'grade': grade_stat.grade_class.name,
                'education_level': grade_stat.grade_class.education_level.title,
                'average_performance': float(grade_stat.average_performance),
                'total_students': grade_stat.total_students
            })
        
        # Recent enrollments by education level
        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        
        recent_enrollments = []
        for level in education_levels:
            new_students = UserProfile.objects.filter(
                education_level=level,
                role='beneficiary',
                registration_date__gte=current_month_start
            ).count()
            
            if new_students > 0:
                recent_enrollments.append({
                    'level': level.title,
                    'new_students': new_students,
                    'color': level.color_gradient.split(' ')[0].replace('from-', '')
                })
        
        return JsonResponse({
            'success': True,
            'dashboard': {
                'overall_stats': {
                    'total_students': total_students,
                    'active_students': active_students,
                    'overall_average_performance': float(overall_average)
                },
                'education_levels': level_stats,
                'top_performing_grades': top_grades_list,
                'recent_enrollments': recent_enrollments,
                'timestamp': timezone.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Get education dashboard error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch education dashboard data'
        }, status=500)

@csrf_exempt
def update_education_level(request, level_key):
    """Update education level information"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Get education level
        try:
            level = EducationLevel.objects.get(level_key=level_key)
        except EducationLevel.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Education level not found'
            }, status=404)
        
        data = json.loads(request.body)
        
        with transaction.atomic():
            # Update level fields
            update_fields = ['title', 'description', 'icon_name', 'color_gradient', 'order', 'is_active']
            
            for field in update_fields:
                if field in data:
                    setattr(level, field, data[field])
            
            level.save()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='update',
                model_name='EducationLevel',
                object_id=level.id,
                description=f'Updated education level: {level.title}',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Education level updated successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Update education level error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to update education level'
        }, status=500)

@csrf_exempt
def create_grade(request):
    """Create a new grade/class"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['education_level_id', 'name', 'short_code']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        # Get education level
        try:
            education_level = EducationLevel.objects.get(id=data['education_level_id'])
        except EducationLevel.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Education level not found'
            }, status=404)
        
        # Check if short code already exists
        if GradeClass.objects.filter(short_code=data['short_code']).exists():
            return JsonResponse({
                'success': False,
                'error': 'Short code already exists'
            }, status=409)
        
        with transaction.atomic():
            # Create grade
            grade = GradeClass.objects.create(
                education_level=education_level,
                name=data['name'],
                short_code=data['short_code'],
                description=data.get('description', ''),
                order=data.get('order', 0),
                is_active=data.get('is_active', True)
            )
            
            # Create grade statistics
            GradeStats.objects.create(grade_class=grade)
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='create',
                model_name='GradeClass',
                object_id=grade.id,
                description=f'Created grade: {grade.name}',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Grade created successfully',
            'grade_id': grade.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Create grade error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to create grade'
        }, status=500)

@csrf_exempt
def assign_student_to_education_level(request, user_id):
    """Assign a student to an education level and grade"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        
        # Get student
        try:
            user = User.objects.get(id=user_id)
            profile = UserProfile.objects.get(user=user)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return JsonResponse({
                'success': False,
                'error': 'Student not found'
            }, status=404)
        
        # Validate education level
        if 'education_level_id' not in data:
            return JsonResponse({
                'success': False,
                'error': 'Education level is required'
            }, status=400)
        
        try:
            education_level = EducationLevel.objects.get(id=data['education_level_id'])
        except EducationLevel.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Education level not found'
            }, status=404)
        
        with transaction.atomic():
            # Update profile
            profile.education_level = education_level
            
            # Update grade if provided
            if 'grade_class_id' in data and data['grade_class_id']:
                try:
                    grade_class = GradeClass.objects.get(
                        id=data['grade_class_id'],
                        education_level=education_level
                    )
                    profile.grade_class = grade_class
                except GradeClass.DoesNotExist:
                    return JsonResponse({
                        'success': False,
                        'error': 'Grade not found or does not belong to selected education level'
                    }, status=404)
            
            profile.save()
            
            # Update education level statistics
            stats, _ = EducationLevelStats.objects.get_or_create(education_level=education_level)
            stats.update_statistics()
            
            # Update grade statistics if grade is assigned
            if profile.grade_class:
                grade_stats, _ = GradeStats.objects.get_or_create(grade_class=profile.grade_class)
                grade_stats.update_statistics()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='update',
                model_name='UserProfile',
                object_id=profile.id,
                description=f'Assigned {profile.full_name} to {education_level.title}',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Student assigned successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Assign student error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to assign student'
        }, status=500)

# Update the create_beneficiary function to include education level and grade
@csrf_exempt
def create_beneficiary(request):
    """Create a new beneficiary user account with education level"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Handle multipart/form-data
        data = request.POST
        files = request.FILES
        
        # Required fields
        required_fields = ['first_name', 'last_name', 'email', 'phone_number', 'school']
        
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        email = data['email'].strip().lower()
        
        # Validate email
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid email format'
            }, status=400)
        
        # Check if user already exists
        existing_user = User.objects.filter(email=email).first()
        
        with transaction.atomic():
            user = None
            profile = None
            
            if existing_user:
                # User already exists, check if they already have a profile
                try:
                    profile = UserProfile.objects.get(user=existing_user)
                    return JsonResponse({
                        'success': False,
                        'error': 'A beneficiary with this email already exists'
                    }, status=409)
                except UserProfile.DoesNotExist:
                    # User exists but doesn't have a profile, use existing user
                    user = existing_user
                    # Update user info
                    user.first_name = data['first_name'].strip()
                    user.last_name = data['last_name'].strip()
                    user.save()
                    
                    # Generate a new password for existing user
                    import secrets
                    import string
                    alphabet = string.ascii_letters + string.digits
                    password = ''.join(secrets.choice(alphabet) for _ in range(12))
                    user.set_password(password)
                    user.save()
            else:
                # Create new user account
                import secrets
                import string
                alphabet = string.ascii_letters + string.digits
                password = ''.join(secrets.choice(alphabet) for _ in range(12))
                
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=data['first_name'].strip(),
                    last_name=data['last_name'].strip(),
                    is_active=True,
                    is_staff=False,
                    is_superuser=False
                )
            
            # Get education level and grade if provided
            education_level = None
            grade_class = None
            
            if data.get('education_level_id'):
                try:
                    education_level = EducationLevel.objects.get(id=data['education_level_id'])
                except EducationLevel.DoesNotExist:
                    pass
            
            if data.get('grade_class_id') and education_level:
                try:
                    grade_class = GradeClass.objects.get(
                        id=data['grade_class_id'],
                        education_level=education_level
                    )
                except GradeClass.DoesNotExist:
                    pass
            
            # Check if profile already exists (should not happen with our check above, but just in case)
            try:
                profile = UserProfile.objects.get(user=user)
                # Update existing profile
                update_fields = [
                    'phone_number', 'date_of_birth', 'gender', 'national_id',
                    'address', 'county', 'constituency', 'school', 'admission_number',
                    'school_type', 'guardian_name', 'guardian_phone', 'guardian_email',
                    'guardian_relationship', 'emergency_contact_name', 'emergency_contact_phone',
                    'sponsorship_status'
                ]
                
                for field in update_fields:
                    if data.get(field):
                        setattr(profile, field, data[field])
                
                # Update education level and grade class
                if education_level:
                    profile.education_level = education_level
                if grade_class:
                    profile.grade_class = grade_class
                
                profile.is_verified = True
                profile.verification_level = 3
                profile.role = 'beneficiary'
                
                profile.save()
            except UserProfile.DoesNotExist:
                # Create new user profile
                profile_data = {
                    'user': user,
                    'role': 'beneficiary',
                    'education_level': education_level,
                    'grade_class': grade_class,
                    'phone_number': data['phone_number'].strip(),
                    'date_of_birth': data.get('date_of_birth') if data.get('date_of_birth') else None,
                    'gender': data.get('gender'),
                    'national_id': data.get('national_id'),
                    'address': data.get('address'),
                    'county': data.get('county'),
                    'constituency': data.get('constituency'),
                    'school': data['school'].strip(),
                    'admission_number': data.get('admission_number'),
                    'school_type': data.get('school_type'),
                    'guardian_name': data.get('guardian_name'),
                    'guardian_phone': data.get('guardian_phone'),
                    'guardian_email': data.get('guardian_email'),
                    'guardian_relationship': data.get('guardian_relationship'),
                    'emergency_contact_name': data.get('emergency_contact_name'),
                    'emergency_contact_phone': data.get('emergency_contact_phone'),
                    'sponsorship_status': data.get('sponsorship_status', 'active'),
                    'sponsorship_start_date': data.get('sponsorship_start_date') if data.get('sponsorship_start_date') else None,
                    'is_verified': True,
                    'verification_level': 3
                }
                
                profile = UserProfile.objects.create(**profile_data)
            
            # Handle profile image upload
            profile_image = files.get('profile_image')
            if profile_image:
                # Validate image
                if profile_image.size > 5 * 1024 * 1024:
                    return JsonResponse({
                        'success': False,
                        'error': 'Profile image must be less than 5MB'
                    }, status=400)
                
                # Validate file type
                allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
                file_name = profile_image.name.lower()
                file_extension = os.path.splitext(file_name)[1]
                
                if file_extension not in allowed_extensions:
                    return JsonResponse({
                        'success': False,
                        'error': 'Profile image must be JPG, PNG, or GIF'
                    }, status=400)
                
                # Save image
                import uuid
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = default_storage.save(
                    f'profile_images/{unique_filename}',
                    ContentFile(profile_image.read())
                )
                profile.profile_image = file_path
                profile.save()
            
            # Update education level statistics if level is assigned
            if education_level:
                stats, _ = EducationLevelStats.objects.get_or_create(education_level=education_level)
                stats.update_statistics()
            
            # Update grade statistics if grade is assigned
            if grade_class:
                grade_stats, _ = GradeStats.objects.get_or_create(grade_class=grade_class)
                grade_stats.update_statistics()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='create',
                model_name='UserProfile',
                object_id=profile.id,
                description=f'Created/updated beneficiary account for {profile.full_name}',
                request=request
            )
            
            # Create notification for admin
            AdminNotification.objects.create(
                title='New Beneficiary Created',
                message=f'Successfully created beneficiary account for {profile.full_name}',
                notification_type='system',
                recipient=admin_user,
                related_object_id=profile.id,
                related_object_type='UserProfile'
            )
        
        # Prepare response
        return JsonResponse({
            'success': True,
            'message': 'Beneficiary created successfully',
            'beneficiary': {
                'id': user.id,
                'full_name': profile.full_name,
                'email': user.email,
                'username': user.username,
                'education_level': {
                    'id': education_level.id if education_level else None,
                    'title': education_level.title if education_level else None
                },
                'grade_class': {
                    'id': grade_class.id if grade_class else None,
                    'name': grade_class.name if grade_class else None
                },
                'profile_image_url': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None
            }
        })
        
    except Exception as e:
        logger.error(f"Create beneficiary error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': f'Failed to create beneficiary: {str(e)}'
        }, status=500)

# Update the get_beneficiaries function to filter by education level
@csrf_exempt
def get_beneficiaries(request):
    """Get list of beneficiaries with filtering and pagination"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        search = request.GET.get('search', '')
        status = request.GET.get('status', '')
        county = request.GET.get('county', '')
        grade_class_id = request.GET.get('grade_class_id', '')  # Changed from 'grade'
        sort_by = request.GET.get('sort_by', '-registration_date')
        
        # Build query
        query = Q(role='beneficiary')
        
        if search:
            query &= (
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(school__icontains=search) |
                Q(admission_number__icontains=search)
            )
        
        if status:
            query &= Q(sponsorship_status=status)
        
        if county:
            query &= Q(county__icontains=county)
        
        if grade_class_id:
            query &= Q(grade_class_id=grade_class_id)
        
        # Get beneficiaries with user data
        beneficiaries = UserProfile.objects.filter(query).select_related(
            'user', 'education_level', 'grade_class'
        ).order_by(sort_by)
        
        # Calculate summary stats
        total_count = beneficiaries.count()
        active_count = beneficiaries.filter(sponsorship_status='active').count()
        pending_count = beneficiaries.filter(is_verified=False).count()
        
        # Paginate
        paginator = Paginator(beneficiaries, limit)
        page_obj = paginator.get_page(page)
        
        # Format response
        beneficiaries_list = []
        for profile in page_obj:
            # Get latest academic performance
            latest_academic = AcademicSummary.objects.filter(
                user=profile.user
            ).order_by('-year', '-term').first()
            
            # Get total fees and payments
            fee_statements = FeeStatement.objects.filter(user=profile.user)
            total_fees = fee_statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            total_paid = fee_statements.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
            
            beneficiaries_list.append({
                'id': profile.user.id,
                'full_name': profile.full_name,
                'email': profile.user.email,
                'phone_number': profile.phone_number,
                'school': profile.school,
                'grade': profile.grade_class.name if profile.grade_class else None,  # Fixed: Use grade_class
                'county': profile.county,
                'sponsorship_status': profile.sponsorship_status,
                'is_verified': profile.is_verified,
                'registration_date': profile.registration_date.isoformat(),
                'years_in_program': profile.years_in_program,
                'academic_performance': float(latest_academic.average_score) if latest_academic else None,
                'academic_rank': latest_academic.class_rank if latest_academic else None,  # Added rank
                'total_fees': str(total_fees),
                'total_paid': str(total_paid),
                'balance': str(total_fees - total_paid),
                'profile_image_url': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None,
                'education_level': {
                    'id': profile.education_level.id if profile.education_level else None,
                    'title': profile.education_level.title if profile.education_level else None,
                    'key': profile.education_level.level_key if profile.education_level else None
                } if profile.education_level else None,
                'grade_class': {
                    'id': profile.grade_class.id if profile.grade_class else None,
                    'name': profile.grade_class.name if profile.grade_class else None
                } if profile.grade_class else None
            })
        
        return JsonResponse({
            'success': True,
            'beneficiaries': beneficiaries_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            },
            'summary': {
                'total': total_count,
                'active': active_count,
                'pending_verification': pending_count
            }
        })
        
    except Exception as e:
        logger.error(f"Get beneficiaries error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch beneficiaries'
        }, status=500)

# Update the admin_dashboard to include education level statistics
@csrf_exempt
def admin_dashboard(request):
    """Get admin dashboard data including education level overview"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        today = timezone.now().date()
        
        # ESSENTIAL STATISTICS
        try:
            # Beneficiary counts
            total_beneficiaries = UserProfile.objects.filter(role='beneficiary').count()
            active_beneficiaries = UserProfile.objects.filter(
                role='beneficiary',
                sponsorship_status='active'
            ).count()
            pending_verification = UserProfile.objects.filter(
                role='beneficiary',
                is_verified=False
            ).count()
            
            # New beneficiaries this month
            current_month_start = today.replace(day=1)
            new_this_month = UserProfile.objects.filter(
                role='beneficiary',
                registration_date__gte=current_month_start
            ).count()
            
            # Financial data
            total_aid_result = Payment.objects.filter(status='verified').aggregate(total=Sum('amount'))
            total_aid_disbursed = total_aid_result['total'] or Decimal('0')
            
            # This month's disbursements
            month_aid_result = Payment.objects.filter(
                status='verified',
                payment_date__gte=current_month_start
            ).aggregate(total=Sum('amount'))
            month_aid_disbursed = month_aid_result['total'] or Decimal('0')
            
            # Pending items counts
            pending_documents = Document.objects.filter(status='pending').count()
            pending_payments = Payment.objects.filter(status='pending').count()
            
            # Document status counts
            approved_documents = Document.objects.filter(status='approved').count()
            rejected_documents = Document.objects.filter(status='rejected').count()
            
            # Payment status counts
            verified_payments = Payment.objects.filter(status='verified').count()
            
            # Education level distribution
            education_levels = EducationLevel.objects.filter(is_active=True)
            level_distribution = []
            
            for level in education_levels:
                stats, _ = EducationLevelStats.objects.get_or_create(education_level=level)
                level_distribution.append({
                    'level': level.title,
                    'key': level.level_key,
                    'total_students': stats.total_students,
                    'color_gradient': level.color_gradient,
                    'icon': level.icon_name
                })
            
        except Exception as e:
            logger.error(f"Error calculating stats: {e}")
            # Set defaults
            total_beneficiaries = 0
            active_beneficiaries = 0
            pending_verification = 0
            new_this_month = 0
            total_aid_disbursed = Decimal('0')
            month_aid_disbursed = Decimal('0')
            pending_documents = 0
            pending_payments = 0
            approved_documents = 0
            rejected_documents = 0
            verified_payments = 0
            level_distribution = []
        
        # RECENT ACTIVITIES - Last 10 items
        recent_activities = []
        try:
            # Recent documents
            recent_docs = Document.objects.select_related('user').order_by('-uploaded_at')[:5]
            for doc in recent_docs:
                recent_activities.append({
                    'id': f"doc_{doc.id}",
                    'type': 'document',
                    'title': f"Document uploaded: {doc.name}",
                    'user': f"{doc.user.first_name} {doc.user.last_name}".strip() or doc.user.username,
                    'time': doc.uploaded_at.isoformat(),
                    'status': doc.status
                })
            
            # Recent payments
            recent_payments = Payment.objects.select_related('user').order_by('-created_at')[:5]
            for payment in recent_payments:
                recent_activities.append({
                    'id': f"pay_{payment.id}",
                    'type': 'payment',
                    'title': f"Payment submitted: KES {payment.amount}",
                    'user': f"{payment.user.first_name} {payment.user.last_name}".strip() or payment.user.username,
                    'time': payment.created_at.isoformat(),
                    'status': payment.status
                })
            
            # Sort by time
            recent_activities.sort(key=lambda x: x['time'], reverse=True)
            recent_activities = recent_activities[:8]
            
        except Exception as e:
            logger.error(f"Error getting recent activities: {e}")
        
        # PENDING REVIEWS - Counts by type
        pending_reviews = {
            'documents': pending_documents,
            'payments': pending_payments,
            'total': pending_documents + pending_payments
        }
        
        # UPCOMING DUE DATES - Next 5 fee statements
        upcoming_due_dates = []
        try:
            upcoming_fees = FeeStatement.objects.filter(
                due_date__gte=today,
                status__in=['unpaid', 'partial', 'pending']
            ).select_related('user').order_by('due_date')[:5]
            
            for fee in upcoming_fees:
                upcoming_due_dates.append({
                    'id': fee.id,
                    'title': f"{fee.user.first_name}'s {fee.term} fees",
                    'due_date': fee.due_date.isoformat(),
                    'amount': str(fee.balance),
                    'status': fee.status
                })
        except Exception as e:
            logger.error(f"Error getting upcoming due dates: {e}")
        
        # GEOGRAPHICAL DISTRIBUTION - Top 5 counties
        geographical_distribution = []
        try:
            counties = UserProfile.objects.filter(
                role='beneficiary',
                county__isnull=False
            ).exclude(county='').values('county').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
            
            for county in counties:
                geographical_distribution.append({
                    'county': county['county'],
                    'students': county['count']
                })
        except Exception as e:
            logger.error(f"Error getting geographical distribution: {e}")
        
        # UNREAD NOTIFICATIONS COUNT
        try:
            unread_notifications = AdminNotification.objects.filter(
                recipient=user,
                is_read=False
            ).count()
        except Exception as e:
            logger.error(f"Error counting notifications: {e}")
            unread_notifications = 0
        
        return JsonResponse({
            'success': True,
            'dashboard': {
                'stats': {
                    # Beneficiary stats
                    'total_beneficiaries': total_beneficiaries,
                    'active_beneficiaries': active_beneficiaries,
                    'pending_verification': pending_verification,
                    'new_this_month': new_this_month,
                    
                    # Financial stats
                    'total_aid_disbursed': str(total_aid_disbursed),
                    'month_aid_disbursed': str(month_aid_disbursed),
                    
                    # Document stats
                    'pending_documents': pending_documents,
                    'approved_documents': approved_documents,
                    'rejected_documents': rejected_documents,
                    
                    # Payment stats
                    'pending_payments': pending_payments,
                    'verified_payments': verified_payments,
                    
                    # System stats
                    'unread_notifications': unread_notifications
                },
                'education_level_distribution': level_distribution,
                'pending_reviews': pending_reviews,
                'recent_activities': recent_activities,
                'upcoming_due_dates': upcoming_due_dates,
                'geographical_distribution': geographical_distribution,
                'user': {
                    'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'email': user.email,
                    'role': 'admin'
                },
                'timestamp': timezone.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Admin dashboard error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to load dashboard data'
        }, status=500)

# Keep all other existing view functions (review_document, verify_payment, etc.) 
# ... [Keep all your existing view functions] ...

def get_relative_time(dt):
    """Helper function to get relative time string"""
    if not dt:
        return "Unknown time"
    
    try:
        now = timezone.now()
        diff = now - dt
        
        if diff.days > 365:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
        elif diff.days > 30:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    except Exception as e:
        logger.error(f"Error calculating relative time: {e}")
        return "Recently"

@csrf_exempt
def send_welcome_email(request, user_id):
    """Send welcome email with login credentials to beneficiary"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        password = data.get('password')
        
        if not password:
            return JsonResponse({
                'success': False,
                'error': 'Password is required'
            }, status=400)
        
        try:
            user = User.objects.get(id=user_id)
            profile = UserProfile.objects.get(user=user)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return JsonResponse({
                'success': False,
                'error': 'Beneficiary not found'
            }, status=404)
        
        # Here you would implement actual email sending
        # For now, we'll just log it
        logger.info(f"Welcome email for {user.email}:")
        logger.info(f"Login URL: {request.build_absolute_uri('/login')}")
        logger.info(f"Email: {user.email}")
        logger.info(f"Temporary password: {password}")
        
        # In production, you would use Django's email system:
        # from django.core.mail import send_mail
        # send_mail(
        #     'Welcome to Kids League Kenya',
        #     f'Your account has been created. Login with:\nEmail: {user.email}\nPassword: {password}',
        #     'noreply@kidsleaguekenya.org',
        #     [user.email],
        #     fail_silently=False,
        # )
        
        # Create audit log
        create_audit_log(
            user=admin_user,
            action_type='update',
            model_name='User',
            object_id=user.id,
            description=f'Sent welcome email to {profile.full_name}',
            request=request
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Welcome email sent successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Send welcome email error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to send welcome email'
        }, status=500)




@csrf_exempt
def get_beneficiary_detail(request, user_id):
    """Get detailed information about a specific beneficiary"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get beneficiary
        try:
            beneficiary = User.objects.get(id=user_id)
            profile = UserProfile.objects.get(user=beneficiary)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return JsonResponse({
                'success': False,
                'error': 'Beneficiary not found'
            }, status=404)
        
        # Get academic records
        academic_summaries = AcademicSummary.objects.filter(user=beneficiary).order_by('-year', '-term')
        academic_history = []
        for summary in academic_summaries:
            academic_history.append({
                'term': summary.term,
                'year': summary.year,
                'average_score': float(summary.average_score),
                'average_grade': summary.average_grade,
                'mean_grade': summary.mean_grade,
                'class_rank': summary.class_rank,
                'total_students': summary.total_students,
                'attendance_percentage': float(summary.attendance_percentage),
                'remarks': summary.remarks,
                'created_at': summary.created_at.isoformat()
            })
        
        # Get fee statements
        fee_statements = FeeStatement.objects.filter(user=beneficiary).order_by('-year', '-term')
        fee_history = []
        for statement in fee_statements:
            fee_history.append({
                'id': statement.id,
                'term': statement.term,
                'year': statement.year,
                'school': statement.school,
                'total_amount': str(statement.total_amount),
                'amount_paid': str(statement.amount_paid),
                'balance': str(statement.balance),
                'due_date': statement.due_date.isoformat(),
                'status': statement.status,
                'payment_percentage': float(statement.payment_percentage),
                'created_at': statement.created_at.isoformat()
            })
        
        # Get payments
        payments = Payment.objects.filter(user=beneficiary).order_by('-payment_date')
        payment_history = []
        for payment in payments:
            payment_history.append({
                'id': payment.id,
                'receipt_number': payment.receipt_number,
                'amount': str(payment.amount),
                'payment_date': payment.payment_date.isoformat(),
                'payment_method': payment.get_payment_method_display(),
                'term': payment.term,
                'year': payment.year,
                'status': payment.status,
                'verified_at': payment.verified_at.isoformat() if payment.verified_at else None,
                'verification_notes': payment.verification_notes,
                'receipt_file_url': request.build_absolute_uri(payment.receipt_file.url) if payment.receipt_file else None
            })
        
        # Get documents
        documents = Document.objects.filter(user=beneficiary).order_by('-uploaded_at')
        document_list = []
        for doc in documents:
            document_list.append({
                'id': doc.id,
                'name': doc.name,
                'document_type': doc.get_document_type_display(),
                'status': doc.status,
                'uploaded_at': doc.uploaded_at.isoformat(),
                'reviewed_at': doc.reviewed_at.isoformat() if doc.reviewed_at else None,
                'reviewer_notes': doc.reviewer_notes,
                'file_url': request.build_absolute_uri(doc.file.url) if doc.file else None
            })
        
        # Get messages
        messages = Message.objects.filter(
            Q(sender=beneficiary) | Q(recipient=beneficiary)
        ).order_by('-sent_at')[:20]
        
        message_list = []
        for msg in messages:
            message_list.append({
                'id': msg.id,
                'subject': msg.subject,
                'content': msg.content,
                'sender': {
                    'id': msg.sender.id,
                    'name': f"{msg.sender.first_name} {msg.sender.last_name}".strip() or msg.sender.username,
                    'email': msg.sender.email
                },
                'recipient': {
                    'id': msg.recipient.id,
                    'name': f"{msg.recipient.first_name} {msg.recipient.last_name}".strip() or msg.recipient.username,
                    'email': msg.recipient.email
                },
                'sent_at': msg.sent_at.isoformat(),
                'is_read': msg.is_read
            })
        
        # Calculate statistics
        total_fees = fee_statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        total_paid = fee_statements.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
        total_balance = total_fees - total_paid
        
        # Latest academic performance
        latest_academic = academic_summaries.first()
        
        return JsonResponse({
            'success': True,
            'beneficiary': {
                'id': beneficiary.id,
                'full_name': profile.full_name,
                'email': beneficiary.email,
                'phone_number': profile.phone_number,
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'gender': profile.gender,
                'national_id': profile.national_id,
                'address': profile.address,
                'county': profile.county,
                'constituency': profile.constituency,
                'school': profile.school,
                'grade': profile.grade_class.name if profile.grade_class else None,  # Fixed: Use grade_class
                'education_level': {
                    'id': profile.education_level.id if profile.education_level else None,
                    'title': profile.education_level.title if profile.education_level else None,
                    'key': profile.education_level.level_key if profile.education_level else None
                },
                'admission_number': profile.admission_number,
                'school_type': profile.school_type,
                'guardian_name': profile.guardian_name,
                'guardian_phone': profile.guardian_phone,
                'guardian_email': profile.guardian_email,
                'guardian_relationship': profile.guardian_relationship,
                'emergency_contact_name': profile.emergency_contact_name,
                'emergency_contact_phone': profile.emergency_contact_phone,
                'sponsorship_status': profile.sponsorship_status,
                'sponsorship_start_date': profile.sponsorship_start_date.isoformat() if profile.sponsorship_start_date else None,
                'sponsorship_end_date': profile.sponsorship_end_date.isoformat() if profile.sponsorship_end_date else None,
                'is_verified': profile.is_verified,
                'verification_level': profile.verification_level,
                'registration_date': profile.registration_date.isoformat(),
                'profile_image_url': request.build_absolute_uri(profile.profile_image.url) if profile.profile_image else None,
                'years_in_program': profile.years_in_program,
                'is_currently_sponsored': profile.is_currently_sponsored
            },
            'statistics': {
                'total_fees': str(total_fees),
                'total_paid': str(total_paid),
                'total_balance': str(total_balance),
                'payment_percentage': float((total_paid / total_fees * 100) if total_fees > 0 else 0),
                'documents_count': documents.count(),
                'pending_documents': documents.filter(status='pending').count(),
                'academic_average': float(latest_academic.average_score) if latest_academic else None,
                'academic_rank': latest_academic.class_rank if latest_academic else None
            },
            'academic_history': academic_history,
            'fee_history': fee_history,
            'payment_history': payment_history,
            'documents': document_list,
            'messages': message_list
        })
        
    except Exception as e:
        logger.error(f"Get beneficiary detail error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch beneficiary details'
        }, status=500)

# Update the update_beneficiary_details function with better error handling
@csrf_exempt
def update_beneficiary_details(request, user_id):
    """Update beneficiary details including profile image"""
    try:
        logger.info(f"Update beneficiary request for user_id: {user_id}")
        logger.info(f"Method: {request.method}")
        logger.info(f"POST data keys: {list(request.POST.keys()) if request.POST else 'No POST data'}")
        logger.info(f"FILES keys: {list(request.FILES.keys()) if request.FILES else 'No FILES data'}")
        
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Get beneficiary
        try:
            beneficiary = User.objects.get(id=user_id)
            profile = UserProfile.objects.get(user=beneficiary)
            logger.info(f"Found beneficiary: {beneficiary.email}, profile: {profile.id}")
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            logger.error(f"Beneficiary not found: user_id={user_id}")
            return JsonResponse({
                'success': False,
                'error': 'Beneficiary not found'
            }, status=404)
        
        # Handle multipart/form-data
        data = request.POST
        files = request.FILES
        
        with transaction.atomic():
            # Update user fields
            if data.get('first_name') or data.get('last_name'):
                if data.get('first_name'):
                    beneficiary.first_name = data['first_name'].strip()
                    logger.info(f"Updating first_name to: {data['first_name'].strip()}")
                if data.get('last_name'):
                    beneficiary.last_name = data['last_name'].strip()
                    logger.info(f"Updating last_name to: {data['last_name'].strip()}")
                beneficiary.save()
            
            # Update profile fields
            update_fields = [
                'phone_number', 'date_of_birth', 'gender', 'national_id',
                'address', 'county', 'constituency', 'school', 'admission_number',
                'school_type', 'guardian_name', 'guardian_phone', 'guardian_email',
                'guardian_relationship', 'emergency_contact_name', 'emergency_contact_phone',
                'sponsorship_status', 'is_verified'
            ]
            
            for field in update_fields:
                if field in data:
                    value = data[field]
                    if value == '':
                        value = None
                    setattr(profile, field, value)
                    logger.info(f"Updating {field} to: {value}")
            
            # Handle boolean field for is_verified
            if 'is_verified' in data:
                profile.is_verified = data['is_verified'].lower() == 'true'
                logger.info(f"Setting is_verified to: {profile.is_verified}")
            
            # Update education level and grade if provided
            if data.get('education_level_id'):
                try:
                    education_level = EducationLevel.objects.get(id=data['education_level_id'])
                    profile.education_level = education_level
                    logger.info(f"Setting education_level to: {education_level.title}")
                except EducationLevel.DoesNotExist:
                    logger.warning(f"Education level not found: id={data['education_level_id']}")
            
            if data.get('grade_class_id'):
                try:
                    grade_class = GradeClass.objects.get(id=data['grade_class_id'])
                    # Don't check education level match for now to simplify
                    profile.grade_class = grade_class
                    logger.info(f"Setting grade_class to: {grade_class.name}")
                except GradeClass.DoesNotExist:
                    logger.warning(f"Grade class not found: id={data['grade_class_id']}")
            
            # Handle profile image upload
            profile_image = files.get('profile_image')
            if profile_image:
                logger.info(f"Processing profile image upload: {profile_image.name}, size: {profile_image.size}")
                # Validate image
                if profile_image.size > 5 * 1024 * 1024:
                    return JsonResponse({
                        'success': False,
                        'error': 'Profile image must be less than 5MB'
                    }, status=400)
                
                # Validate file type
                allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
                file_name = profile_image.name.lower()
                file_extension = os.path.splitext(file_name)[1]
                
                if file_extension not in allowed_extensions:
                    return JsonResponse({
                        'success': False,
                        'error': 'Profile image must be JPG, PNG, GIF, or WebP'
                    }, status=400)
                
                # Delete old image if exists
                if profile.profile_image:
                    try:
                        if os.path.isfile(profile.profile_image.path):
                            os.remove(profile.profile_image.path)
                            logger.info(f"Deleted old profile image: {profile.profile_image.path}")
                    except Exception as e:
                        logger.warning(f"Could not delete old profile image: {e}")
                
                # Save new image
                import uuid
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = default_storage.save(
                    f'profile_images/{unique_filename}',
                    ContentFile(profile_image.read())
                )
                profile.profile_image = file_path
                logger.info(f"Saved new profile image: {file_path}")
            
            profile.save()
            logger.info(f"Profile saved successfully")
            
            # Update education level statistics if level changed
            if 'education_level_id' in data or 'grade_class_id' in data:
                if profile.education_level:
                    stats, _ = EducationLevelStats.objects.get_or_create(
                        education_level=profile.education_level
                    )
                    stats.update_statistics()
                
                if profile.grade_class:
                    grade_stats, _ = GradeStats.objects.get_or_create(
                        grade_class=profile.grade_class
                    )
                    grade_stats.update_statistics()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='update',
                model_name='UserProfile',
                object_id=profile.id,
                description=f'Updated beneficiary profile for {profile.full_name}',
                request=request
            )
            
            # Create notification
            AdminNotification.objects.create(
                title='Beneficiary Updated',
                message=f'Beneficiary {profile.full_name} profile has been updated',
                notification_type='system',
                recipient=admin_user,
                related_object_id=profile.id,
                related_object_type='UserProfile'
            )
        
        # Build image URL properly
        profile_image_url = None
        if profile.profile_image:
            try:
                # Check if file exists before building URL
                if default_storage.exists(profile.profile_image.name):
                    profile_image_url = request.build_absolute_uri(profile.profile_image.url)
                    logger.info(f"Profile image URL: {profile_image_url}")
                else:
                    logger.warning(f"Profile image file not found: {profile.profile_image.name}")
            except Exception as e:
                logger.error(f"Error building profile image URL: {e}")
        
        return JsonResponse({
            'success': True,
            'message': 'Beneficiary updated successfully',
            'beneficiary': {
                'id': beneficiary.id,
                'full_name': profile.full_name,
                'email': beneficiary.email,
                'profile_image_url': profile_image_url,
                'updated_at': profile.last_updated.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Update beneficiary error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': f'Failed to update beneficiary: {str(e)}'
        }, status=500)


from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

@csrf_exempt
def send_welcome_email(request, user_id):
    """Send welcome email with login credentials to beneficiary"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        password = data.get('password')
        
        if not password:
            return JsonResponse({
                'success': False,
                'error': 'Password is required'
            }, status=400)
        
        try:
            user = User.objects.get(id=user_id)
            profile = UserProfile.objects.get(user=user)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return JsonResponse({
                'success': False,
                'error': 'Beneficiary not found'
            }, status=404)
        
        # Prepare email content
        login_url = request.build_absolute_uri('/login')
        
        # HTML email template
        html_message = render_to_string('emails/welcome_email.html', {
            'full_name': profile.full_name,
            'email': user.email,
            'password': password,
            'login_url': login_url,
            'admin_name': f"{admin_user.first_name} {admin_user.last_name}".strip() or admin_user.username,
        })
        
        plain_message = strip_tags(html_message)
        
        try:
            # Send email
            send_mail(
                subject='Welcome to Kids League Kenya - Your Account Details',
                message=plain_message,
                from_email=DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            # Also send to guardian if email exists
            if profile.guardian_email:
                guardian_html = render_to_string('emails/guardian_welcome_email.html', {
                    'student_name': profile.full_name,
                    'guardian_name': profile.guardian_name,
                    'email': user.email,
                    'login_url': login_url,
                    'admin_name': f"{admin_user.first_name} {admin_user.last_name}".strip() or admin_user.username,
                })
                
                send_mail(
                    subject=f'Welcome to Kids League Kenya - {profile.full_name}\'s Account Details',
                    message=strip_tags(guardian_html),
                    from_email=DEFAULT_FROM_EMAIL,
                    recipient_list=[profile.guardian_email],
                    html_message=guardian_html,
                    fail_silently=True,  # Don't fail if guardian email fails
                )
            
        except Exception as email_error:
            logger.error(f"Email sending error: {email_error}")
            # Don't fail the whole request if email fails
            # Just log it and continue
        
        # Create audit log
        create_audit_log(
            user=admin_user,
            action_type='update',
            model_name='User',
            object_id=user.id,
            description=f'Sent welcome email to {profile.full_name}',
            request=request
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Welcome email sent successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Send welcome email error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to send welcome email'
        }, status=500)



@csrf_exempt
def review_document(request, document_id):
    """Review/approve/reject a document"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        status = data.get('status', '')
        notes = data.get('notes', '')
        
        if status not in ['approved', 'rejected', 'requires_action']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid status'
            }, status=400)
        
        # Get document
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Document not found'
            }, status=404)
        
        with transaction.atomic():
            # Update document
            document.status = status
            document.reviewed_at = datetime.now()
            document.reviewer_notes = notes
            document.save()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='update',
                model_name='Document',
                object_id=document.id,
                description=f'Changed document status to {status}: {document.name}',
                request=request
            )
            
            # Create notification for beneficiary
            AdminNotification.objects.create(
                title=f'Document {status.capitalize()}',
                message=f'Your document "{document.name}" has been {status}.',
                notification_type='document',
                recipient=document.user,
                related_object_id=document.id,
                related_object_type='Document'
            )
        
        return JsonResponse({
            'success': True,
            'message': f'Document {status} successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Review document error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to review document'
        }, status=500)

@csrf_exempt
def verify_payment(request, payment_id):
    """Verify or reject a payment"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        status = data.get('status', '')  # 'verified' or 'rejected'
        notes = data.get('notes', '')
        
        if status not in ['verified', 'rejected']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid status'
            }, status=400)
        
        # Get payment
        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Payment not found'
            }, status=404)
        
        with transaction.atomic():
            # Update payment
            if status == 'verified':
                payment.mark_as_verified(verified_by=admin_user, notes=notes)
            else:
                payment.mark_as_rejected(notes=notes)
                payment.verified_by = admin_user
                payment.verified_at = datetime.now()
                payment.save()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='verify' if status == 'verified' else 'reject',
                model_name='Payment',
                object_id=payment.id,
                description=f'Payment {status}: {payment.receipt_number} - KES {payment.amount}',
                request=request
            )
            
            # Create notification for beneficiary
            AdminNotification.objects.create(
                title=f'Payment {status.capitalize()}',
                message=f'Your payment of KES {payment.amount} ({payment.receipt_number}) has been {status}.',
                notification_type='payment',
                recipient=payment.user,
                related_object_id=payment.id,
                related_object_type='Payment'
            )
        
        return JsonResponse({
            'success': True,
            'message': f'Payment {status} successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Verify payment error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to verify payment'
        }, status=500)

@csrf_exempt
def get_pending_reviews(request):
    """Get all pending items for admin review"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get pending documents
        pending_documents = Document.objects.filter(status='pending').select_related('user').order_by('-uploaded_at')
        
        # Get pending payments
        pending_payments = Payment.objects.filter(status='pending').select_related('user').order_by('-created_at')
        
        # Format response
        documents_list = []
        for doc in pending_documents:
            documents_list.append({
                'id': doc.id,
                'type': 'document',
                'name': doc.name,
                'document_type': doc.get_document_type_display(),
                'beneficiary': {
                    'id': doc.user.id,
                    'name': f"{doc.user.first_name} {doc.user.last_name}".strip() or doc.user.username,
                    'email': doc.user.email
                },
                'uploaded_at': doc.uploaded_at.isoformat(),
                'file_url': request.build_absolute_uri(doc.file.url) if doc.file else None
            })
        
        payments_list = []
        for payment in pending_payments:
            payments_list.append({
                'id': payment.id,
                'type': 'payment',
                'receipt_number': payment.receipt_number,
                'amount': str(payment.amount),
                'payment_method': payment.get_payment_method_display(),
                'beneficiary': {
                    'id': payment.user.id,
                    'name': f"{payment.user.first_name} {payment.user.last_name}".strip() or payment.user.username,
                    'email': payment.user.email
                },
                'payment_date': payment.payment_date.isoformat(),
                'created_at': payment.created_at.isoformat(),
                'receipt_file_url': request.build_absolute_uri(payment.receipt_file.url) if payment.receipt_file else None
            })
        
        # Combine and sort by date
        all_pending = documents_list + payments_list
        all_pending.sort(key=lambda x: x.get('uploaded_at', x.get('created_at')), reverse=True)
        
        return JsonResponse({
            'success': True,
            'pending_items': all_pending,
            'counts': {
                'documents': pending_documents.count(),
                'payments': pending_payments.count(),
                'total': pending_documents.count() + pending_payments.count()
            }
        })
        
    except Exception as e:
        logger.error(f"Get pending reviews error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch pending reviews'
        }, status=500)

@csrf_exempt
def send_admin_message(request):
    """Send message from admin to beneficiary"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        recipient_id = data.get('recipient_id')
        subject = data.get('subject', '').strip()
        content = data.get('content', '').strip()
        
        if not recipient_id or not subject or not content:
            return JsonResponse({
                'success': False,
                'error': 'Recipient, subject, and content are required'
            }, status=400)
        
        # Get recipient
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Recipient not found'
            }, status=404)
        
        # Create message
        message = Message.objects.create(
            sender=admin_user,
            recipient=recipient,
            subject=subject,
            content=content
        )
        
        # Create audit log
        create_audit_log(
            user=admin_user,
            action_type='create',
            model_name='Message',
            object_id=message.id,
            description=f'Sent message to {recipient.email}: {subject}',
            request=request
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
        logger.error(f"Send admin message error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to send message'
        }, status=500)

@csrf_exempt
def get_admin_notifications(request):
    """Get admin notifications"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        notifications = AdminNotification.objects.filter(
            recipient=admin_user
        ).order_by('-created_at')[:50]
        
        notifications_list = []
        for notif in notifications:
            notifications_list.append({
                'id': notif.id,
                'title': notif.title,
                'message': notif.message,
                'type': notif.notification_type,
                'is_read': notif.is_read,
                'created_at': notif.created_at.isoformat(),
                'relative_time': get_relative_time(notif.created_at),
                'related_object_id': notif.related_object_id,
                'related_object_type': notif.related_object_type
            })
        
        # Mark all as read if requested
        mark_all_read = request.GET.get('mark_all_read', '').lower() == 'true'
        if mark_all_read:
            AdminNotification.objects.filter(
                recipient=admin_user,
                is_read=False
            ).update(is_read=True)
        
        return JsonResponse({
            'success': True,
            'notifications': notifications_list,
            'unread_count': notifications.filter(is_read=False).count()
        })
        
    except Exception as e:
        logger.error(f"Get admin notifications error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch notifications'
        }, status=500)

@csrf_exempt
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        try:
            notification = AdminNotification.objects.get(
                id=notification_id,
                recipient=admin_user
            )
        except AdminNotification.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Notification not found'
            }, status=404)
        
        notification.is_read = True
        notification.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Notification marked as read'
        })
        
    except Exception as e:
        logger.error(f"Mark notification read error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to update notification'
        }, status=500)

@csrf_exempt
def get_audit_logs(request):
    """Get audit logs"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        action_type = request.GET.get('action_type', '')
        date_from = request.GET.get('date_from', '')
        date_to = request.GET.get('date_to', '')
        
        # Build query
        query = Q()
        
        if action_type:
            query &= Q(action_type=action_type)
        
        if date_from:
            try:
                from_date = datetime.strptime(date_from, '%Y-%m-%d')
                query &= Q(created_at__gte=from_date)
            except ValueError:
                pass
        
        if date_to:
            try:
                to_date = datetime.strptime(date_to, '%Y-%m-%d')
                query &= Q(created_at__lte=to_date)
            except ValueError:
                pass
        
        # Get audit logs
        audit_logs = AuditLog.objects.filter(query).select_related('user').order_by('-created_at')
        
        # Paginate
        paginator = Paginator(audit_logs, limit)
        page_obj = paginator.get_page(page)
        
        logs_list = []
        for log in page_obj:
            logs_list.append({
                'id': log.id,
                'user': {
                    'id': log.user.id if log.user else None,
                    'name': f"{log.user.first_name} {log.user.last_name}".strip() if log.user else 'System',
                    'email': log.user.email if log.user else None
                },
                'action_type': log.action_type,
                'model_name': log.model_name,
                'object_id': log.object_id,
                'description': log.description,
                'ip_address': log.ip_address,
                'created_at': log.created_at.isoformat(),
                'relative_time': get_relative_time(log.created_at)
            })
        
        return JsonResponse({
            'success': True,
            'audit_logs': logs_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        logger.error(f"Get audit logs error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch audit logs'
        }, status=500)


@csrf_exempt
def calendar_events(request):
    """Get calendar events with filtering"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get query parameters
        month = request.GET.get('month', '')
        event_type = request.GET.get('type', 'all')
        status = request.GET.get('status', 'all')
        
        # Build query
        query = Q()
        
        if month:
            try:
                year, month_num = map(int, month.split('-'))
                query &= Q(start_date__year=year, start_date__month=month_num)
            except ValueError:
                pass
        
        if event_type != 'all':
            query &= Q(event_type=event_type)
        
        if status != 'all':
            if status == 'active':
                query &= Q(is_active=True)
            elif status == 'inactive':
                query &= Q(is_active=False)
        
        # Get events
        events = CalendarEvent.objects.filter(query).order_by('start_date')
        
        return JsonResponse({
            'success': True,
            'events': [
                {
                    'id': event.id,
                    'title': event.title,
                    'description': event.description,
                    'start_date': event.start_date.isoformat(),
                    'end_date': event.end_date.isoformat(),
                    'event_type': event.event_type,
                    'location': event.location,
                    'attendees': event.attendees,
                    'is_active': event.is_active,
                    'created_by': event.created_by.username if event.created_by else 'System',
                    'created_at': event.created_at.isoformat()
                } for event in events
            ]
        })
        
    except Exception as e:
        logger.error(f"Calendar events error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch calendar events'
        }, status=500)

@csrf_exempt
def create_event(request):
    """Create a new calendar event"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['title', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data or not data[field]:
                return JsonResponse({
                    'success': False,
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        # Create event
        with transaction.atomic():
            event = CalendarEvent.objects.create(
                title=data['title'],
                description=data.get('description', ''),
                start_date=data['start_date'],
                end_date=data['end_date'],
                event_type=data.get('event_type', 'academic'),
                location=data.get('location', ''),
                attendees=data.get('attendees'),
                is_active=data.get('is_active', True),
                created_by=admin_user
            )
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='create',
                model_name='CalendarEvent',
                object_id=event.id,
                description=f'Created calendar event: {event.title}',
                request=request
            )
            
            # Create notification for other admins
            AdminNotification.objects.create(
                title='New Calendar Event',
                message=f'New event "{event.title}" has been added to the calendar.',
                notification_type='system',
                recipient=admin_user,
                related_object_id=event.id,
                related_object_type='CalendarEvent'
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Event created successfully',
            'event_id': event.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Create event error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to create event'
        }, status=500)

@csrf_exempt
def update_event(request, event_id):
    """Update a calendar event"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Get event
        try:
            event = CalendarEvent.objects.get(id=event_id)
        except CalendarEvent.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Event not found'
            }, status=404)
        
        data = json.loads(request.body)
        
        # Update event
        with transaction.atomic():
            update_fields = ['title', 'description', 'start_date', 'end_date', 
                           'event_type', 'location', 'attendees', 'is_active']
            
            for field in update_fields:
                if field in data:
                    setattr(event, field, data[field])
            
            event.save()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='update',
                model_name='CalendarEvent',
                object_id=event.id,
                description=f'Updated calendar event: {event.title}',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Event updated successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Update event error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to update event'
        }, status=500)

@csrf_exempt
def calendar_stats(request):
    """Get calendar statistics"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        from datetime import datetime
        
        # Get current month
        now = datetime.now()
        current_month_start = datetime(now.year, now.month, 1)
        next_month = now.month + 1 if now.month < 12 else 1
        next_year = now.year if now.month < 12 else now.year + 1
        current_month_end = datetime(next_year, next_month, 1)
        
        # Calculate stats
        total_events = CalendarEvent.objects.count()
        upcoming_events = CalendarEvent.objects.filter(
            start_date__gte=now,
            is_active=True
        ).count()
        
        # Count by type for current month
        month_events = CalendarEvent.objects.filter(
            start_date__gte=current_month_start,
            start_date__lt=current_month_end,
            is_active=True
        )
        
        exams_count = month_events.filter(event_type='exam').count()
        meetings_count = month_events.filter(event_type='meeting').count()
        holidays_count = month_events.filter(event_type='holiday').count()
        
        return JsonResponse({
            'success': True,
            'stats': {
                'total_events': total_events,
                'upcoming_events': upcoming_events,
                'exams_count': exams_count,
                'meetings_count': meetings_count,
                'holidays_count': holidays_count
            }
        })
        
    except Exception as e:
        logger.error(f"Calendar stats error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch calendar statistics'
        }, status=500)

@csrf_exempt
def academic_terms(request):
    """Get academic terms"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        terms = AcademicTerm.objects.all().order_by('-start_date')
        
        return JsonResponse({
            'success': True,
            'terms': [
                {
                    'id': term.id,
                    'term_name': term.term_name,
                    'start_date': term.start_date.isoformat(),
                    'end_date': term.end_date.isoformat(),
                    'is_active': term.is_active,
                    'total_weeks': term.total_weeks,
                    'current_week': term.current_week
                } for term in terms
            ]
        })
        
    except Exception as e:
        logger.error(f"Academic terms error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch academic terms'
        }, status=500)

@csrf_exempt
def create_term(request):
    """Create a new academic term"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['term_name', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data or not data[field]:
                return JsonResponse({
                    'success': False,
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        with transaction.atomic():
            # If setting as active, deactivate other terms
            if data.get('is_active', False):
                AcademicTerm.objects.filter(is_active=True).update(is_active=False)
            
            # Create term
            term = AcademicTerm.objects.create(
                term_name=data['term_name'],
                start_date=data['start_date'],
                end_date=data['end_date'],
                is_active=data.get('is_active', False)
            )
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='create',
                model_name='AcademicTerm',
                object_id=term.id,
                description=f'Created academic term: {term.term_name}',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Academic term created successfully',
            'term_id': term.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Create term error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to create academic term'
        }, status=500)

@csrf_exempt
def update_term(request, term_id):
    """Update an academic term"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Get term
        try:
            term = AcademicTerm.objects.get(id=term_id)
        except AcademicTerm.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Academic term not found'
            }, status=404)
        
        data = json.loads(request.body)
        
        with transaction.atomic():
            # If setting as active, deactivate other terms
            if data.get('is_active', False):
                AcademicTerm.objects.filter(is_active=True).exclude(id=term_id).update(is_active=False)
            
            # Update term
            update_fields = ['term_name', 'start_date', 'end_date', 'is_active']
            
            for field in update_fields:
                if field in data:
                    setattr(term, field, data[field])
            
            term.save()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='update',
                model_name='AcademicTerm',
                object_id=term.id,
                description=f'Updated academic term: {term.term_name}',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Academic term updated successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Update term error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to update academic term'
        }, status=500)

# Add to administrator/views.py
@csrf_exempt
def download_receipt(request, payment_id):
    """Download payment receipt file"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get payment
        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Payment not found'
            }, status=404)
        
        # Check if file exists
        if not payment.receipt_file:
            return JsonResponse({
                'success': False,
                'error': 'No receipt file attached'
            }, status=404)
        
        # Serve file
        response = FileResponse(payment.receipt_file, as_attachment=True)
        return response
        
    except Exception as e:
        logger.error(f"Download receipt error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to download receipt'
        }, status=500)


@csrf_exempt
def get_fee_statements(request):
    """Get fee statements for admin view"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get query parameters
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        year = request.GET.get('year', None)
        status_filter = request.GET.get('status', None)
        search = request.GET.get('search', '')
        
        # Build query
        query = Q()
        if year:
            query &= Q(year=int(year))
        if status_filter:
            query &= Q(status=status_filter)
        if search:
            query &= (
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(school__icontains=search) |
                Q(term__icontains=search)
            )
        
        # Get fee statements
        statements = FeeStatement.objects.filter(query).select_related('user').order_by('-year', '-term')
        
        # Calculate summary statistics
        total_fees = statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        total_paid = statements.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
        total_balance = total_fees - total_paid
        
        payment_percentage = 0
        if total_fees > 0:
            payment_percentage = (total_paid / total_fees) * 100
        
        # Paginate
        paginator = Paginator(statements, limit)
        page_obj = paginator.get_page(page)
        
        # Format response
        statements_list = []
        for statement in page_obj:
            statements_list.append({
                'id': statement.id,
                'user_id': statement.user.id,
                'student_name': f"{statement.user.first_name} {statement.user.last_name}".strip() or statement.user.username,
                'student_email': statement.user.email,
                'term': statement.term,
                'year': statement.year,
                'school': statement.school,
                'total_amount': str(statement.total_amount),
                'amount_paid': str(statement.amount_paid),
                'balance': str(statement.balance),
                'due_date': statement.due_date.isoformat(),
                'status': statement.status,
                'payment_percentage': float(statement.payment_percentage),
                'statement_file': request.build_absolute_uri(statement.statement_file.url) if statement.statement_file else None,
                'notes': statement.notes,
                'created_at': statement.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'statements': statements_list,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_count': paginator.count,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
        
    except Exception as e:
        logger.error(f"Get fee statements error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch fee statements'
        }, status=500)

@csrf_exempt
def get_statement_summary(request):
    """Get fee statement summary statistics"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get current year
        current_year = datetime.now().year
        
        # Get current year statements
        current_statements = FeeStatement.objects.filter(year=current_year)
        prev_statements = FeeStatement.objects.filter(year=current_year - 1)
        
        # Calculate statistics
        total_fees = current_statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        total_paid = current_statements.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0')
        total_balance = total_fees - total_paid
        
        payment_percentage = 0
        if total_fees > 0:
            payment_percentage = (total_paid / total_fees) * 100
        
        # Calculate year-over-year change
        prev_total = prev_statements.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        fees_change = 0
        if prev_total > 0:
            fees_change = ((total_fees - prev_total) / prev_total) * 100
        
        return JsonResponse({
            'success': True,
            'summary_stats': {
                'total_fees': str(total_fees),
                'total_paid': str(total_paid),
                'total_balance': str(total_balance),
                'payment_percentage': float(payment_percentage),
                'fees_change': float(fees_change)
            }
        })
        
    except Exception as e:
        logger.error(f"Get statement summary error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch statement summary'
        }, status=500)

@csrf_exempt
def get_statement_years(request):
    """Get distinct years from fee statements"""
    try:
        user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get distinct years
        years = FeeStatement.objects.values_list('year', flat=True).distinct().order_by('-year')
        
        return JsonResponse({
            'success': True,
            'years': list(years)
        })
        
    except Exception as e:
        logger.error(f"Get statement years error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to fetch years'
        }, status=500)

@csrf_exempt
def download_statement(request, statement_id):
    """Download fee statement file"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        # Get fee statement
        try:
            statement = FeeStatement.objects.get(id=statement_id)
        except FeeStatement.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Statement not found'
            }, status=404)
        
        # Check if file exists
        if not statement.statement_file:
            return JsonResponse({
                'success': False,
                'error': 'No file attached to this statement'
            }, status=404)
        
        # Create audit log
        create_audit_log(
            user=admin_user,
            action_type='view',
            model_name='FeeStatement',
            object_id=statement.id,
            description=f'Downloaded fee statement: {statement.term} {statement.year} for {statement.user.username}',
            request=request
        )
        
        # Serve file
        from django.http import FileResponse
        response = FileResponse(statement.statement_file, as_attachment=True, 
                               filename=f"fee_statement_{statement.term}_{statement.year}.pdf")
        return response
        
    except Exception as e:
        logger.error(f"Download statement error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to download statement'
        }, status=500)

@csrf_exempt
def update_statement(request, statement_id):
    """Update fee statement information"""
    try:
        admin_user, error_response = verify_admin(request)
        if error_response:
            return error_response
        
        if request.method != 'POST':
            return JsonResponse({
                'success': False,
                'error': 'Method not allowed'
            }, status=405)
        
        # Get fee statement
        try:
            statement = FeeStatement.objects.get(id=statement_id)
        except FeeStatement.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Statement not found'
            }, status=404)
        
        data = json.loads(request.body)
        
        with transaction.atomic():
            # Update statement fields
            update_fields = ['notes']
            
            for field in update_fields:
                if field in data:
                    setattr(statement, field, data[field] if data[field] else None)
            
            # Handle status updates
            if 'status' in data and data['status'] in ['paid', 'partial', 'unpaid', 'overdue', 'pending']:
                statement.status = data['status']
            
            statement.save()
            
            # Create audit log
            create_audit_log(
                user=admin_user,
                action_type='update',
                model_name='FeeStatement',
                object_id=statement.id,
                description=f'Updated fee statement: {statement.term} {statement.year} for {statement.user.username}',
                request=request
            )
        
        return JsonResponse({
            'success': True,
            'message': 'Statement updated successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    except Exception as e:
        logger.error(f"Update statement error: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': 'Failed to update statement'
        }, status=500)