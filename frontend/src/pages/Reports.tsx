import { Button, Card, CardContent } from '@/components/ui/button';
const Reports = () => {
  return (
    <div className="">
      {/* Header */}
      <div
        className=""
      >
        <div>
          <h1 className="text-3xl font-semibold mb-2">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and track key performance metrics
          </p>
        </div>
      </div>
      {/* Coming Soon Content */}
      <Card className="">
        <CardContent>
          <div
            className=""
          >
            <AssessmentIcon className="" />
          </div>
          <h2 className="text-2xl font-semibold mb-4">
            Advanced Reporting Coming Soon
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're working on comprehensive reporting features including patient
            outcomes tracking, medication adherence analytics, clinical
            documentation summaries, and practice performance metrics.
          </p>
          <div
            className=""
          >
            <Button  asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button  asChild>
              <Link to="/contact">Request Features</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Reports;
