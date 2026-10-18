'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';

export default function CustomFieldsPage() {
  return (
    <AppLayout>
      <CustomFieldsManager />
    </AppLayout>
  );
}
