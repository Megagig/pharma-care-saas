# shadcn/ui Component Usage Guide

## Overview

This guide provides comprehensive examples and best practices for using shadcn/ui components in the PharmaCare SaaS application. All components are built on Radix UI primitives and styled with Tailwind CSS.

## Core Components

### Button

The Button component supports multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/button';
import { Plus, Download, Trash2 } from 'lucide-react';

// Basic usage
<Button>Click me</Button>

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icons
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Patient
</Button>

// Icon only
<Button size="sm" variant="ghost">
  <Download className="h-4 w-4" />
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Please wait
</Button>
```

### Card

Cards are flexible containers for grouping related content.

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Patient Information</CardTitle>
    <CardDescription>
      View and edit patient details
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Patient content goes here...</p>
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>

// Card with custom styling
<Card className="w-full max-w-md">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg">Quick Stats</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <div className="flex justify-between">
      <span>Total Patients</span>
      <span className="font-semibold">1,234</span>
    </div>
    <div className="flex justify-between">
      <span>Active Prescriptions</span>
      <span className="font-semibold">567</span>
    </div>
  </CardContent>
</Card>
```

### Input and Label

Form inputs with proper labeling and validation states.

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Basic input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
  />
</div>

// Input with error state
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input
    id="password"
    type="password"
    className="border-destructive"
    placeholder="Enter password"
  />
  <p className="text-sm text-destructive">
    Password must be at least 8 characters
  </p>
</div>

// Input with helper text
<div className="space-y-2">
  <Label htmlFor="phone">Phone Number</Label>
  <Input
    id="phone"
    type="tel"
    placeholder="(555) 123-4567"
  />
  <p className="text-sm text-muted-foreground">
    Include area code for better contact
  </p>
</div>
```

### Select

Dropdown selection components with search and grouping support.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Basic select
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Administrator</SelectItem>
    <SelectItem value="pharmacist">Pharmacist</SelectItem>
    <SelectItem value="technician">Technician</SelectItem>
  </SelectContent>
</Select>

// Controlled select
const [role, setRole] = useState('');

<Select value={role} onValueChange={setRole}>
  <SelectTrigger>
    <SelectValue placeholder="Choose user role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Administrator</SelectItem>
    <SelectItem value="pharmacist">Pharmacist</SelectItem>
    <SelectItem value="technician">Technician</SelectItem>
  </SelectContent>
</Select>

// Select with form integration
<div className="space-y-2">
  <Label>Patient Status</Label>
  <Select value={status} onValueChange={setStatus}>
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Dialog

Modal dialogs for forms, confirmations, and detailed views.

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Basic dialog
<Dialog>
  <DialogTrigger asChild>
    <Button>Add Patient</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add New Patient</DialogTitle>
      <DialogDescription>
        Enter the patient's information below.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save Patient</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Confirmation dialog
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete Patient</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete the
        patient record and all associated data.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Badge

Status indicators and labels.

```tsx
import { Badge } from '@/components/ui/badge';

// Basic badges
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Status indicators
<div className="flex gap-2">
  <Badge className="bg-green-100 text-green-800">Active</Badge>
  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  <Badge className="bg-red-100 text-red-800">Inactive</Badge>
</div>

// With icons
<Badge className="flex items-center gap-1">
  <CheckCircle className="h-3 w-3" />
  Verified
</Badge>

// Notification badge
<div className="relative">
  <Button variant="ghost" size="sm">
    <Bell className="h-4 w-4" />
  </Button>
  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
    3
  </Badge>
</div>
```

### Table

Data tables with sorting, filtering, and pagination.

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Basic table
<Table>
  <TableCaption>A list of recent patients.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>
        <Badge>Active</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>

// With TanStack Table integration
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge>{row.getValue('status')}</Badge>
    ),
  },
];

const table = useReactTable({
  data: patients,
  columns,
  getCoreRowModel: getCoreRowModel(),
});

<Table>
  <TableHeader>
    {table.getHeaderGroups().map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ))}
  </TableHeader>
  <TableBody>
    {table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Tabs

Tabbed interfaces for organizing content.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Basic tabs
<Tabs defaultValue="overview" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="medications">Medications</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Patient Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Patient overview content...</p>
      </CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="medications" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Current Medications</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Medications list...</p>
      </CardContent>
    </Card>
  </TabsContent>
  <TabsContent value="notes" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Clinical Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Clinical notes...</p>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

### Toast Notifications

Toast notifications for user feedback.

```tsx
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

// Success toast
<Button onClick={() => toast.success('Patient saved successfully!')}>
  Save Patient
</Button>

// Error toast
<Button onClick={() => toast.error('Failed to save patient')}>
  Trigger Error
</Button>

// Custom toast with action
<Button onClick={() => 
  toast.success('Patient deleted', {
    action: {
      label: 'Undo',
      onClick: () => console.log('Undo'),
    },
  })
}>
  Delete with Undo
</Button>

// Loading toast
<Button onClick={() => {
  const toastId = toast.loading('Saving patient...');
  
  // Simulate API call
  setTimeout(() => {
    toast.success('Patient saved!', { id: toastId });
  }, 2000);
}}>
  Save with Loading
</Button>
```

### Dropdown Menu

Context menus and dropdown actions.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Basic dropdown
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Patient Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Edit className="mr-2 h-4 w-4" />
      Edit Patient
    </DropdownMenuItem>
    <DropdownMenuItem>
      <FileText className="mr-2 h-4 w-4" />
      View Notes
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Patient
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// User menu example
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <User className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Settings className="mr-2 h-4 w-4" />
      Settings
    </DropdownMenuItem>
    <DropdownMenuItem>
      <HelpCircle className="mr-2 h-4 w-4" />
      Support
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <LogOut className="mr-2 h-4 w-4" />
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Form Patterns

### Complete Form Example

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.date(),
  status: z.enum(['active', 'inactive', 'pending']),
});

type PatientFormData = z.infer<typeof patientSchema>;

function PatientForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      await savePatient(data);
      toast.success('Patient saved successfully!');
    } catch (error) {
      toast.error('Failed to save patient');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add New Patient</CardTitle>
        <CardDescription>
          Enter the patient's information below.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">
                {errors.status.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Patient'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

## Layout Patterns

### Dashboard Layout

```tsx
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <h1 className="text-lg font-semibold">PharmaCare</h1>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <ThemeToggle />
              <UserMenu />
            </nav>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-background md:block">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Patients
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Pill className="mr-2 h-4 w-4" />
                  Medications
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Grid Layout

```tsx
function DashboardGrid() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Patient list */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Appointments list */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

## Best Practices

### Accessibility
- Always use proper semantic HTML elements
- Include ARIA attributes when necessary
- Ensure keyboard navigation works correctly
- Maintain proper color contrast ratios
- Use descriptive labels and help text

### Performance
- Use `React.memo()` for expensive components
- Implement proper loading states
- Use skeleton loaders for better perceived performance
- Optimize images and icons
- Implement virtual scrolling for large lists

### Styling
- Use Tailwind utility classes consistently
- Create reusable component variants
- Follow the design system color palette
- Use proper spacing and typography scales
- Implement responsive design patterns

### Error Handling
- Provide clear error messages
- Use proper validation patterns
- Implement error boundaries
- Show loading and success states
- Handle network errors gracefully

### Testing
- Write unit tests for component logic
- Test accessibility with screen readers
- Implement visual regression tests
- Test keyboard navigation
- Validate form submissions

This guide should be referenced when implementing new features or updating existing components. For additional examples and patterns, refer to the shadcn/ui documentation and the project's component library.