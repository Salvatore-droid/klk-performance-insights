from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    
    # Education Levels URLs
    path('admin/education-levels/', views.get_education_levels, name='get_education_levels'),
    path('admin/education-levels/<str:level_key>/', views.get_education_level_detail, name='education_level_detail'),
    path('admin/education-levels/<str:level_key>/update/', views.update_education_level, name='update_education_level'),
    path('admin/education-dashboard/', views.get_education_dashboard, name='education_dashboard'),
    path('admin/grades/create/', views.create_grade, name='create_grade'),
    path('admin/grades/<int:grade_id>/students/', views.get_grade_students, name='get_grade_students'),
    path('admin/students/<int:user_id>/assign-level/', views.assign_student_to_education_level, name='assign_student_education_level'),
    
    # Beneficiary Management
    path('admin/beneficiaries/', views.get_beneficiaries, name='get_beneficiaries'),
    path('admin/beneficiaries/create/', views.create_beneficiary, name='create_beneficiary'),
    path('admin/beneficiaries/<int:user_id>/', views.get_beneficiary_detail, name='beneficiary_detail'),
    path('admin/beneficiaries/<int:user_id>/update/', views.update_beneficiary_details, name='update_beneficiary'),
    path('admin/beneficiaries/<int:user_id>/send-welcome/', views.send_welcome_email, name='send_welcome_email'),
    
    # Document Management
    path('admin/documents/<int:document_id>/review/', views.review_document, name='review_document'),
    path('admin/documents/pending/', views.get_pending_reviews, name='get_pending_reviews'),
    
    # Payment Management
    path('admin/payments/<int:payment_id>/verify/', views.verify_payment, name='verify_payment'),
    path('admin/payments/<int:payment_id>/download/', views.download_receipt, name='download_receipt'),
    
    # Fee Statements
    path('admin/fee-statements/', views.get_fee_statements, name='get_fee_statements'),
    path('admin/fee-statements/summary/', views.get_statement_summary, name='get_statement_summary'),
    path('admin/fee-statements/years/', views.get_statement_years, name='get_statement_years'),
    path('admin/fee-statements/<int:statement_id>/download/', views.download_statement, name='download_statement'),
    path('admin/fee-statements/<int:statement_id>/update/', views.update_statement, name='update_statement'),
    
    # Communication
    path('admin/messages/send/', views.send_admin_message, name='send_admin_message'),
    
    # Notifications
    path('admin/notifications/', views.get_admin_notifications, name='get_admin_notifications'),
    path('admin/notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    
    # Calendar
    path('admin/calendar/events/', views.calendar_events, name='calendar_events'),
    path('admin/calendar/events/create/', views.create_event, name='create_event'),
    path('admin/calendar/events/<int:event_id>/update/', views.update_event, name='update_event'),
    path('admin/calendar/stats/', views.calendar_stats, name='calendar_stats'),
    
    # Academic Terms
    path('admin/calendar/terms/', views.academic_terms, name='academic_terms'),
    path('admin/calendar/terms/create/', views.create_term, name='create_term'),
    path('admin/calendar/terms/<int:term_id>/update/', views.update_term, name='update_term'),
    
    # Audit Logs
    path('admin/audit-logs/', views.get_audit_logs, name='get_audit_logs'),
]