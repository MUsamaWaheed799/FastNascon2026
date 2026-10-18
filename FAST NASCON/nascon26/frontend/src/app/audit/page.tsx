'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';

export default function AuditPage() {
  return (
    <AppLayout>
      <AuditLogViewer />
    </AppLayout>
  );
}
