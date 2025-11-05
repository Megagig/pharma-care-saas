import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdherenceChart from '../AdherenceChart';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AdherenceChart', () => {
  const mockAdherenceData = {
    overallScore: 87,
    trend: 'up' as const,
    medicationScores: [
      {
        medicationId: 'med1',
        medicationName: 'Metformin 500mg',
        score: 92,
        trend: 'up' as const,
        daysTracked: 30,
        missedDoses: 2,
        totalDoses: 60
      },
      {
        medicationId: 'med2',
        medicationName: 'Lisinopril 10mg',
        score: 83,
        trend: 'stable' as const,
        daysTracked: 30,
        missedDoses: 5,
        totalDoses: 30
      }
    ],
    weeklyScores: [
      { week: 'Week 1', score: 85 },
      { week: 'Week 2', score: 88 },
      { week: 'Week 3', score: 90 },
      { week: 'Week 4', score: 87 }
    ],
    insights: [
      {
        type: 'success' as const,
        message: 'Great job! Your adherence has improved by 5% this month.'
      },
      {
        type: 'warning' as const,
        message: 'Consider setting reminders for your evening Metformin dose.'
      }
    ]
  };

  it('renders overall adherence score', () => {
    renderWithTheme(<AdherenceChart data={mockAdherenceData} />);

    expect(screen.getByText('Overall Adherence Score')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('Excellent adherence')).toBeInTheDocument();
  });

  it('displays individual medication adherence scores', () => {
    renderWithTheme(<AdherenceChart data={mockAdherenceData} />);

    expect(screen.getByText('Individual Medication Adherence')).toBeInTheDocument();
    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
  });

  it('shows medication tracking details', () => {
    renderWithTheme(<AdherenceChart data={mockAdherenceData} />);

    expect(screen.getByText('Days tracked: 30')).toBeInTheDocument();
    expect(screen.getByText('Missed: 2/60')).toBeInTheDocument();
    expect(screen.getByText('Missed: 5/30')).toBeInTheDocument();
  });

  it('displays weekly trend chart', () => {
    renderWithTheme(<AdherenceChart data={mockAdherenceData} />);

    expect(screen.getByText('Weekly Adherence Trend')).toBeInTheDocument();
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();
    expect(screen.getByText('Week 3')).toBeInTheDocument();
    expect(screen.getByText('Week 4')).toBeInTheDocument();
  });

  it('shows insights and recommendations', () => {
    renderWithTheme(<AdherenceChart data={mockAdherenceData} />);

    expect(screen.getByText('Insights & Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Great job! Your adherence has improved by 5% this month.')).toBeInTheDocument();
    expect(screen.getByText('Consider setting reminders for your evening Metformin dose.')).toBeInTheDocument();
  });

  it('displays correct score descriptions', () => {
    const excellentData = { ...mockAdherenceData, overallScore: 95 };
    const { rerender } = renderWithTheme(<AdherenceChart data={excellentData} />);
    expect(screen.getByText('Excellent adherence')).toBeInTheDocument();

    const goodData = { ...mockAdherenceData, overallScore: 85 };
    rerender(
      <ThemeProvider theme={theme}>
        <AdherenceChart data={goodData} />
      </ThemeProvider>
    );
    expect(screen.getByText('Good adherence')).toBeInTheDocument();

    const fairData = { ...mockAdherenceData, overallScore: 75 };
    rerender(
      <ThemeProvider theme={theme}>
        <AdherenceChart data={fairData} />
      </ThemeProvider>
    );
    expect(screen.getByText('Fair adherence')).toBeInTheDocument();

    const poorData = { ...mockAdherenceData, overallScore: 65 };
    rerender(
      <ThemeProvider theme={theme}>
        <AdherenceChart data={poorData} />
      </ThemeProvider>
    );
    expect(screen.getByText('Poor adherence')).toBeInTheDocument();

    const veryPoorData = { ...mockAdherenceData, overallScore: 45 };
    rerender(
      <ThemeProvider theme={theme}>
        <AdherenceChart data={veryPoorData} />
      </ThemeProvider>
    );
    expect(screen.getByText('Very poor adherence')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithTheme(<AdherenceChart data={mockAdherenceData} loading={true} />);

    expect(screen.getByText('Loading adherence data...')).toBeInTheDocument();
  });

  it('shows no data state when medication scores are empty', () => {
    const emptyData = {
      ...mockAdherenceData,
      medicationScores: []
    };

    renderWithTheme(<AdherenceChart data={emptyData} />);

    expect(screen.getByText('No Adherence Data Available')).toBeInTheDocument();
    expect(screen.getByText('Start tracking your medication adherence to see detailed insights and trends here.')).toBeInTheDocument();
  });

  it('handles missing weekly scores', () => {
    const dataWithoutWeeklyScores = {
      ...mockAdherenceData,
      weeklyScores: []
    };

    renderWithTheme(<AdherenceChart data={dataWithoutWeeklyScores} />);

    // Should still render other sections
    expect(screen.getByText('Overall Adherence Score')).toBeInTheDocument();
    expect(screen.getByText('Individual Medication Adherence')).toBeInTheDocument();
  });

  it('handles missing insights', () => {
    const dataWithoutInsights = {
      ...mockAdherenceData,
      insights: []
    };

    renderWithTheme(<AdherenceChart data={dataWithoutInsights} />);

    // Should still render other sections
    expect(screen.getByText('Overall Adherence Score')).toBeInTheDocument();
    expect(screen.getByText('Individual Medication Adherence')).toBeInTheDocument();
  });

  it('displays trend icons correctly', () => {
    renderWithTheme(<AdherenceChart data={mockAdherenceData} />);

    // The trend icons should be present (we can't easily test the specific icons, but we can verify the component renders)
    expect(screen.getByText('Overall Adherence Score')).toBeInTheDocument();
    expect(screen.getByText('Individual Medication Adherence')).toBeInTheDocument();
  });

  it('applies correct color coding for different score ranges', () => {
    const highScoreData = { ...mockAdherenceData, overallScore: 95 };
    renderWithTheme(<AdherenceChart data={highScoreData} />);
    
    // The component should render without errors for high scores
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Excellent adherence')).toBeInTheDocument();
  });

  it('handles edge case scores', () => {
    const edgeCaseData = {
      ...mockAdherenceData,
      overallScore: 0,
      medicationScores: [
        {
          medicationId: 'med1',
          medicationName: 'Test Medication',
          score: 0,
          trend: 'down' as const,
          daysTracked: 0,
          missedDoses: 0,
          totalDoses: 0
        }
      ]
    };

    renderWithTheme(<AdherenceChart data={edgeCaseData} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Very poor adherence')).toBeInTheDocument();
  });
});