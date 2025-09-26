describe('MuiAdapter', () => {
  describe('Button Adapter', () => {
    it('should render a button with mapped props', () => {
      render(
        <MuiAdapter
          component="Button"
          >
          Test Button
        </MuiAdapter>
      );

      const button = screen.getByRole('button', { name: 'Test Button' });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should handle disabled state', () => {
      render(
        <MuiAdapter
          component="Button"
          >
          Disabled Button
        </MuiAdapter>
      );

      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toBeDisabled();
    });
  });

  describe('TextField Adapter', () => {
    it('should render an input with label', () => {
      render(
        <MuiAdapter
          component="TextField"
          
        />
      );

      const label = screen.getByText('Test Label');
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });

    it('should show error state with helper text', () => {
      render(
        <MuiAdapter
          component="TextField"
          
        />
      );

      const helperText = screen.getByText('This field has an error');
      expect(helperText).toBeInTheDocument();
    });
  });

  describe('Card Adapter', () => {
    it('should render a card with content', () => {
      render(
        <MuiAdapter
          component="Card"
          >
          <div>Card Content</div>
        </MuiAdapter>
      );

      const cardContent = screen.getByText('Card Content');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe('Chip/Badge Adapter', () => {
    it('should render a badge with label', () => {
      render(
        <MuiAdapter
          component="Chip"
          
        />
      );

      const badge = screen.getByText('Test Badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Typography Adapter', () => {
    it('should render typography with correct heading level', () => {
      render(
        <MuiAdapter
          component="Typography"
          >
          Main Heading
        </MuiAdapter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Main Heading');
    });

    it('should render body text as paragraph', () => {
      render(
        <MuiAdapter
          component="Typography"
          >
          Body text content
        </MuiAdapter>
      );

      const paragraph = screen.getByText('Body text content');
      expect(paragraph).toBeInTheDocument();
    });
  });

  describe('Unsupported Component', () => {
    it('should render a fallback div for unsupported components', () => {
      render(
        <MuiAdapter
          // @ts-expect-error Testing unsupported component
          component="UnsupportedComponent"
          >
          Fallback content
        </MuiAdapter>
      );

      const content = screen.getByText('Fallback content');
      expect(content).toBeInTheDocument();
    });
  });
});

describe('MuiIconAdapter', () => {
  it('should render a Lucide icon for mapped MUI icon', () => {
    render(
      <MuiIconAdapter
        iconName="Add"
        data-testid="add-icon"
      />
    );

    const icon = screen.getByTestId('add-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should render a placeholder for unmapped icon', () => {
    render(
      <MuiIconAdapter
        iconName="UnknownIcon"
        data-testid="unknown-icon"
      />
    );

    const placeholder = screen.getByTestId('unknown-icon');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveTextContent('?');
  });

  it('should apply custom size and color', () => {
    render(
      <MuiIconAdapter
        iconName="Search"
        size={32}
        color="red"
        data-testid="search-icon"
      />
    );

    const icon = screen.getByTestId('search-icon');
    expect(icon).toBeInTheDocument();
  });
});