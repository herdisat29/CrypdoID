import MissionHub from './MissionHub';

import { View } from '../../types';

interface MissionsViewProps {
  missionSyncKey?: number;
  onNavigate: (view: View) => void;
}

export default function MissionsView({ missionSyncKey, onNavigate }: MissionsViewProps) {
  return <MissionHub key={missionSyncKey} onNavigate={(v: string) => onNavigate(v as View)} />;
}
