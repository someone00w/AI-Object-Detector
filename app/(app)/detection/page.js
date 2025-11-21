'use client';

import DetectionCuh from '@/app/components/detectioncuh';

export default function DetectionPage() {
  // The (app) layout already handles auth check and navbar
  // So this page just renders the detection component
  
  return (
    <div className="px-4 sm:px-6 py-6">
      <DetectionCuh />
    </div>
  );
}