from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    # path('admin/analytics/', views.get_analytics_data, name='get_analytics_data'),
    # path('admin/stats/detailed/', views.get_detailed_stats, name='get_detailed_stats'),
    # Beneficiary Management
    path('admin/beneficiaries/', views.get_beneficiaries, name='get_beneficiaries'),
    path('admin/beneficiaries/create/', views.create_beneficiary, name='create_beneficiary'),
    path('admin/beneficiaries/<int:user_id>/welcome-email/', views.send_welcome_email, name='send_welcome_email'),
    path('admin/beneficiaries/<int:user_id>/', views.get_beneficiary_detail, name='get_beneficiary_detail'),
    path('admin/beneficiaries/<int:user_id>/update/', views.update_beneficiary, name='update_beneficiary'),
    
    # Document Management
    path('admin/documents/<int:document_id>/review/', views.review_document, name='review_document'),
    
    # Payment Management
    path('admin/payments/<int:payment_id>/verify/', views.verify_payment, name='verify_payment'),
    
    # Pending Reviews
    path('admin/pending-reviews/', views.get_pending_reviews, name='get_pending_reviews'),
    
    # Communication
    path('admin/messages/send/', views.send_admin_message, name='send_admin_message'),
    
    # Notifications
    path('admin/notifications/', views.get_admin_notifications, name='get_admin_notifications'),
    path('admin/notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    
    # Audit Logs
    path('admin/audit-logs/', views.get_audit_logs, name='get_audit_logs'),
    # Calendar URLs
    path('admin/calendar/events/', views.calendar_events, name='calendar_events'),
    path('admin/calendar/events/create/', views.create_event, name='create_event'),
    path('admin/calendar/events/<int:event_id>/update/', views.update_event, name='update_event'),
    path('admin/calendar/stats/', views.calendar_stats, name='calendar_stats'),
    path('admin/calendar/terms/', views.academic_terms, name='academic_terms'),
    path('admin/calendar/terms/create/', views.create_term, name='create_term'),
    path('admin/calendar/terms/<int:term_id>/update/', views.update_term, name='update_term'),
    # In administrator/urls.py
    path('admin/payments/<int:payment_id>/download/', views.download_receipt, name='download_receipt'),
    # Fee Statements
    path('admin/fee-statements/', views.get_fee_statements, name='get_fee_statements'),
    path('admin/fee-statements/years/', views.get_statement_years, name='get_statement_years'),
    path('admin/statement-summary/', views.get_statement_summary, name='get_statement_summary'),
    path('admin/fee-statements/<int:statement_id>/download/', views.download_statement, name='download_statement'),
    path('admin/fee-statements/<int:statement_id>/update/', views.update_statement, name='update_statement'),
]