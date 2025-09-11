import { useContext } from 'react';
import FeatureFlagContext from '../context/FeatureFlagContext';

export const useFeatureFlags = () => {
   const context = useContext(FeatureFlagContext);
   if (context === undefined) {
      throw new Error(
         'useFeatureFlags must be used within a FeatureFlagProvider'
      );
   }
   return context;
};

export default useFeatureFlags;
