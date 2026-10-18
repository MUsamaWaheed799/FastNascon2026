'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { OpportunityModal } from '@/components/opportunities/OpportunityModal';

export default function PipelinePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AppLayout>
      <KanbanBoard onOpenCreateModal={() => setIsModalOpen(true)} />
      <OpportunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AppLayout>
  );
}
