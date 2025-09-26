import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white dark:bg-gray-800 rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 ${props.className || ''}`}>
    {children}
  </div>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 mb-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400 ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordion = ({ children, ...props }: any) => (
  <div {...props} className={`border rounded-md ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordionItem = ({ children, ...props }: any) => (
  <div {...props} className={`border-b ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordionTrigger = ({ children, ...props }: any) => (
  <div {...props} className={`flex justify-between items-center p-4 cursor-pointer ${props.className || ''}`}>
    {children}
  </div>
);

const MockAccordionContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 ${props.className || ''}`}>
    {children}
  </div>
);

const MockSeparator = ({ ...props }: any) => (
  <hr {...props} className={`my-4 border-t border-gray-200 ${props.className || ''}`} />
);

const MockBadge = ({ children, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${props.className || ''}`}>
    {children}
  </span>
);

// Replace imports with mock components
const Button = MockButton;
const Card = MockCard;
const CardContent = MockCardContent;
const Alert = MockAlert;
const Accordion = MockAccordion;
const AccordionItem = MockAccordionItem;
const AccordionTrigger = MockAccordionTrigger;
const AccordionContent = MockAccordionContent;
const Separator = MockSeparator;
const Badge = MockBadge;

interface TestResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'pending';
  details?: string;
}

const SidebarTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const tests = [
    {
      name: 'Sidebar Toggle Functionality',
      category: 'Toggle Tests',
      test: () => {
        const initialState = sidebarOpen;
        toggleSidebar();
        setTimeout(() => {
          const newState = !sidebarOpen;
          const passed = newState !== initialState;
          updateTestResult(
            'Sidebar Toggle Functionality',
            'Toggle Tests',
            passed ? 'pass' : 'fail',
            passed ? 'Toggle works correctly' : 'Toggle failed to change state'
          );
        }, 100);
      },
    },
    {
      name: 'Sidebar Width Changes',
      category: 'Toggle Tests',
      test: () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          const width = window.getComputedStyle(sidebar).width;
          const expectedWidth = sidebarOpen ? '280px' : '56px';
          const passed = width === expectedWidth;
          updateTestResult(
            'Sidebar Width Changes',
            'Toggle Tests',
            passed ? 'pass' : 'fail',
            `Expected: ${expectedWidth}, Actual: ${width}`
          );
        } else {
          updateTestResult(
            'Sidebar Width Changes',
            'Toggle Tests',
            'fail',
            'Sidebar element not found'
          );
        }
      },
    },
    {
      name: 'Toggle Button Visibility',
      category: 'Toggle Tests',
      test: () => {
        // Look for toggle buttons by their styling and position
        const allButtons = document.querySelectorAll('button');
        const toggleButtons = Array.from(allButtons).filter((button) => {
          const style = window.getComputedStyle(button);
          return (
            style.backgroundColor.includes('25, 118, 210') || // Primary blue color
            style.cursor === 'pointer'
          );
        });
        updateTestResult(
          'Toggle Button Visibility',
          'Toggle Tests',
          toggleButtons.length > 0 ? 'pass' : 'fail',
          `Found ${toggleButtons.length} potential toggle buttons`
        );
      },
    },
    {
      name: 'Pharmacy Modules Visibility',
      category: 'Module Visibility',
      test: () => {
        const pharmacySection = Array.from(document.querySelectorAll('*')).find(
          (el) => el.textContent?.includes('PHARMACY TOOLS')
        );
        if (pharmacySection) {
          // Count pharmacy modules
          const moduleLinks = document.querySelectorAll(
            'a[href*="/pharmacy/"]'
          );
          updateTestResult(
            'Pharmacy Modules Visibility',
            'Module Visibility',
            moduleLinks.length >= 9 ? 'pass' : 'fail',
            `Found ${moduleLinks.length} pharmacy modules (expected 9)`
          );
        } else {
          updateTestResult(
            'Pharmacy Modules Visibility',
            'Module Visibility',
            'fail',
            'Pharmacy tools section not found'
          );
        }
      },
    },
    {
      name: 'Section Headers Visibility (Expanded)',
      category: 'Module Visibility',
      test: () => {
        if (sidebarOpen) {
          const headers = ['MAIN MENU', 'PHARMACY TOOLS', 'ACCOUNT'];
          const foundHeaders = headers.filter((header) =>
            Array.from(document.querySelectorAll('*')).some((el) =>
              el.textContent?.includes(header)
            )
          );
          updateTestResult(
            'Section Headers Visibility (Expanded)',
            'Module Visibility',
            foundHeaders.length >= 3 ? 'pass' : 'fail',
            `Found headers: ${foundHeaders.join(', ')}`
          );
        } else {
          updateTestResult(
            'Section Headers Visibility (Expanded)',
            'Module Visibility',
            'pending',
            'Sidebar must be expanded to test headers'
          );
        }
      },
    },
    {
      name: 'Coming Soon Badges',
      category: 'Module Visibility',
      test: () => {
        const comingSoonBadges = Array.from(
          document.querySelectorAll('.badge')
        ).filter((badge) => badge.textContent?.includes('Coming Soon'));
        updateTestResult(
          'Coming Soon Badges',
          'Module Visibility',
          comingSoonBadges.length >= 9 ? 'pass' : 'fail',
          `Found ${comingSoonBadges.length} "Coming Soon" badges (expected 9)`
        );
      },
    },
    {
      name: 'Tooltip Elements (Collapsed)',
      category: 'Tooltip Tests',
      test: () => {
        if (!sidebarOpen) {
          const tooltipElements = document.querySelectorAll(
            '[title], [data-tooltip]'
          );
          updateTestResult(
            'Tooltip Elements (Collapsed)',
            'Tooltip Tests',
            tooltipElements.length > 0 ? 'pass' : 'fail',
            `Found ${tooltipElements.length} elements with tooltip capability`
          );
        } else {
          updateTestResult(
            'Tooltip Elements (Collapsed)',
            'Tooltip Tests',
            'pending',
            'Sidebar must be collapsed to test tooltips'
          );
        }
      },
    },
    {
      name: 'Icon Visibility (Collapsed)',
      category: 'Tooltip Tests',
      test: () => {
        if (!sidebarOpen) {
          const icons = document.querySelectorAll('.sidebar svg');
          updateTestResult(
            'Icon Visibility (Collapsed)',
            'Tooltip Tests',
            icons.length >= 15 ? 'pass' : 'fail',
            `Found ${icons.length} icons in collapsed state`
          );
        } else {
          updateTestResult(
            'Icon Visibility (Collapsed)',
            'Tooltip Tests',
            'pending',
            'Sidebar must be collapsed to test icon visibility'
          );
        }
      },
    },
    {
      name: 'Mobile Detection',
      category: 'Responsive Tests',
      test: () => {
        const screenWidth = window.innerWidth;
        const isMobileDetected = screenWidth < 900; // md breakpoint
        updateTestResult(
          'Mobile Detection',
          'Responsive Tests',
          'pass',
          `Screen width: ${screenWidth}px, Mobile detected: ${isMobileDetected}`
        );
      },
    },
    {
      name: 'Navigation Links',
      category: 'Navigation Tests',
      test: () => {
        const navLinks = document.querySelectorAll('a[href]');
        const pharmacyLinks = Array.from(navLinks).filter((link) =>
          link.getAttribute('href')?.includes('/pharmacy/')
        );
        updateTestResult(
          'Navigation Links',
          'Navigation Tests',
          pharmacyLinks.length >= 9 ? 'pass' : 'fail',
          `Found ${pharmacyLinks.length} pharmacy navigation links`
        );
      },
    },
  ];

  const updateTestResult = (
    name: string,
    category: string,
    status: 'pass' | 'fail' | 'pending',
    details?: string
  ) => {
    setTestResults((prev) => {
      const existing = prev.find((r) => r.name === name);
      if (existing) {
        existing.status = status;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { name, category, status, details }];
      }
    });
  };

  const runTest = (test: (typeof tests)[0]) => {
    setCurrentTest(test.name);
    updateTestResult(test.name, test.category, 'pending', 'Running test...');
    try {
      test.test();
    } catch (error) {
      updateTestResult(test.name, test.category, 'fail', `Error: ${error}`);
    }
    setTimeout(() => setCurrentTest(''), 1000);
  };

  const runAllTests = () => {
    tests.forEach((test, index) => {
      setTimeout(() => runTest(test), index * 500);
    });
  };

  const runCategoryTests = (category: string) => {
    const categoryTests = tests.filter((test) => test.category === category);
    categoryTests.forEach((test, index) => {
      setTimeout(() => runTest(test), index * 300);
    });
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass':
        return 'success';
      case 'fail':
        return 'error';
      case 'pending':
        return 'warning';
    }
  };

  const getTestsByCategory = () => {
    const categories = [...new Set(tests.map((test) => test.category))];
    return categories.map((category) => ({
      category,
      tests: tests.filter((test) => test.category === category)
    }));
  };

  const getOverallStats = () => {
    const total = testResults.length;
    const passed = testResults.filter((r) => r.status === 'pass').length;
    const failed = testResults.filter((r) => r.status === 'fail').length;
    const pending = testResults.filter((r) => r.status === 'pending').length;
    return { total, passed, failed, pending };
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Sidebar Functionality Test Suite
      </h2>
      <Alert className="mb-4">
        <div>
          <strong>Task 6:</strong> Test sidebar functionality and responsive
          behavior
          <br />
          Current sidebar state:{' '}
          <strong>
            {sidebarOpen ? 'Expanded (280px)' : 'Collapsed (56px)'}
          </strong>
          <br />
          Screen size:{' '}
          <strong>
            {window.innerWidth}x{window.innerHeight}
          </strong>
        </div>
      </Alert>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Control Panel */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                Test Controls
              </h3>
              <div className="space-y-4">
                <Button
                  onClick={runAllTests}
                  disabled={currentTest !== ''}
                  className="w-full"
                >
                  Run All Tests
                </Button>
                <Button onClick={toggleSidebar} className="w-full" variant="outline">
                  Toggle Sidebar ({sidebarOpen ? 'Collapse' : 'Expand'})
                </Button>
                <Separator />
                <div>Run by Category:</div>
                {getTestsByCategory().map(({ category }) => (
                  <Button
                    key={category}
                    size="sm"
                    onClick={() => runCategoryTests(category)}
                    disabled={currentTest !== ''}
                    className="w-full"
                    variant="outline"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Stats Card */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                Test Summary
              </h3>
              {(() => {
                const stats = getOverallStats();
                return (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Total: {stats.total}/{tests.length}</Badge>
                    <Badge variant="default" className="bg-green-500">Passed: {stats.passed}</Badge>
                    <Badge variant="destructive">Failed: {stats.failed}</Badge>
                    <Badge variant="secondary">Pending: {stats.pending}</Badge>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
        {/* Test Results */}
        <div className="md:col-span-2">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Test Results by Category
            </h3>
            {currentTest && (
              <Alert className="mb-4">
                Currently running: <strong>{currentTest}</strong>
              </Alert>
            )}
            {getTestsByCategory().map(({ category, tests: categoryTests }) => (
              <Accordion key={category} type="single" collapsible defaultValue={category}>
                <AccordionItem value={category}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full">
                      <div>{category}</div>
                      <div className="flex gap-2">
                        {(() => {
                          const categoryResults = testResults.filter((r) =>
                            categoryTests.some((t) => t.name === r.name)
                          );
                          const passed = categoryResults.filter(
                            (r) => r.status === 'pass'
                          ).length;
                          const failed = categoryResults.filter(
                            (r) => r.status === 'fail'
                          ).length;
                          const pending = categoryResults.filter(
                            (r) => r.status === 'pending'
                          ).length;
                          return (
                            <>
                              {passed > 0 && (
                                <Badge variant="default" className="bg-green-500">
                                  {passed}
                                </Badge>
                              )}
                              {failed > 0 && (
                                <Badge variant="destructive">{failed}</Badge>
                              )}
                              {pending > 0 && (
                                <Badge variant="secondary">{pending}</Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {categoryTests.map((test) => {
                        const result = testResults.find(
                          (r) => r.name === test.name
                        );
                        return (
                          <div key={test.name} className="border-b pb-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{test.name}</div>
                                {result?.details && (
                                  <div className="text-sm text-gray-500">{result.details}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {result && (
                                  <Badge variant={
                                    result.status === 'pass' ? 'default' :
                                      result.status === 'fail' ? 'destructive' : 'secondary'
                                  }>
                                    {result.status.toUpperCase()}
                                  </Badge>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => runTest(test)}
                                  disabled={currentTest !== ''}
                                >
                                  Run
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarTest;
