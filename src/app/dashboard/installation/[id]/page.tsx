"use client";

import InstallationEditor from "@/components/Installation/InstallationEditor/InstallationEditor";
import { useParams } from "next/navigation";
import ReadOnlyInstallationEditor from "@/components/Installation/ReadOnlyInstallationEditor/ReadOnlyInstallationEditor";
import { usePermissions } from "@/hooks/usePermissions";
import OutlookScannerWrapper from "@/components/Outlook/OutlookScanner";

export default function InstallationEditorPage() {
  const params = useParams();
  const jobId = Number(params.id);

  const { canEditInstallation } = usePermissions();

  if (canEditInstallation) {
    return (
      <div>
        <InstallationEditor jobId={jobId} />
        <OutlookScannerWrapper jobId={jobId} />
      </div>
    );
  }

  return <ReadOnlyInstallationEditor jobId={jobId} />;
}
