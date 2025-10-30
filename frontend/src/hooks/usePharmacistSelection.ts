import { useState, useEffect } from 'react';
import { useUsers } from '../queries/useUsers';

export interface PharmacistOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const usePharmacistSelection = () => {
  const [selectedPharmacistId, setSelectedPharmacistId] = useState<string>('');
  const { data: usersData, isLoading } = useUsers();

  // Get pharmacists from users data
  const pharmacists: PharmacistOption[] = (usersData?.data?.users || [])
    .filter((user: any) => 
      user.workplaceRole === 'Pharmacist' || 
      user.workplaceRole === 'Owner' ||
      user.role === 'pharmacist' ||
      user.role === 'owner'
    )
    .map((user: any) => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.workplaceRole || user.role,
    }));

  // Auto-select first pharmacist if none selected
  useEffect(() => {
    if (!selectedPharmacistId && pharmacists.length > 0) {
      setSelectedPharmacistId(pharmacists[0].id);
    }
  }, [pharmacists, selectedPharmacistId]);

  const selectedPharmacist = pharmacists.find(p => p.id === selectedPharmacistId);

  return {
    pharmacists,
    selectedPharmacistId,
    selectedPharmacist,
    setSelectedPharmacistId,
    isLoading,
  };
};