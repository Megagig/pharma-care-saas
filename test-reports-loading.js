// Simple test to verify reports loading behavior
console.log('🧪 Testing Reports Loading Behavior');

// Simulate the store behavior
const mockStore = {
  loading: {},
  activeReport: null,
  
  setLoading: function(reportType, isLoading) {
    this.loading[reportType] = isLoading;
    console.log(`📊 Loading state for ${reportType}: ${isLoading}`);
  },
  
  setActiveReport: function(reportType) {
    this.activeReport = reportType;
    console.log(`🎯 Active report set to: ${reportType}`);
  },
  
  isCurrentReportLoading: function() {
    const result = this.activeReport ? this.loading[this.activeReport] || false : false;
    console.log(`🔍 Is current report loading? ${result} (active: ${this.activeReport})`);
    return result;
  },
  
  clearAllLoadingStates: function() {
    this.loading = {};
    console.log('🧹 All loading states cleared');
  }
};

// Test scenarios
console.log('\n--- Test 1: Initial state ---');
console.log('Loading states:', mockStore.loading);
console.log('Active report:', mockStore.activeReport);
console.log('Should show loading overlay:', mockStore.activeReport && mockStore.isCurrentReportLoading());

console.log('\n--- Test 2: Set active report without loading ---');
mockStore.setActiveReport('patient-outcomes');
console.log('Should show loading overlay:', mockStore.activeReport && mockStore.isCurrentReportLoading());

console.log('\n--- Test 3: Start loading for active report ---');
mockStore.setLoading('patient-outcomes', true);
console.log('Should show loading overlay:', mockStore.activeReport && mockStore.isCurrentReportLoading());

console.log('\n--- Test 4: Stop loading ---');
mockStore.setLoading('patient-outcomes', false);
console.log('Should show loading overlay:', mockStore.activeReport && mockStore.isCurrentReportLoading());

console.log('\n--- Test 5: Clear all loading states ---');
mockStore.setLoading('patient-outcomes', true);
mockStore.clearAllLoadingStates();
console.log('Should show loading overlay:', mockStore.activeReport && mockStore.isCurrentReportLoading());

console.log('\n✅ Test completed');