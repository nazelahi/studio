
'use client';
import Link from 'next/link';
import * as React from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  Users,
  Building2,
  DollarSign,
  LineChart,
  Settings,
  Home as HomeIcon,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import type { Tenant } from '@/types';

const initialTenants: Tenant[] = [
  {
    id: 'T001',
    name: 'Alice Johnson',
    property: 'Apt 101, Bldg A',
    rent: 1200,
    dueDate: '2024-08-01',
    status: 'Paid',
    avatar: 'https://placehold.co/40x40.png',
  },
  {
    id: 'T002',
    name: 'Bob Smith',
    property: 'Apt 102, Bldg A',
    rent: 1250,
    dueDate: '2024-08-01',
    status: 'Pending',
    avatar: 'https://placehold.co/40x40.png',
  },
  {
    id: 'T003',
    name: 'Charlie Brown',
    property: 'Apt 201, Bldg B',
    rent: 1400,
    dueDate: '2024-08-01',
    status: 'Overdue',
    avatar: 'https://placehold.co/40x40.png',
  },
];

export default function TenantsPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>(initialTenants);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddTenant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newTenant: Tenant = {
      id: `T${String(tenants.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      property: formData.get('property') as string,
      rent: Number(formData.get('rent')),
      dueDate: '2024-09-01', // This should be dynamic
      status: 'Pending',
      avatar: previewImage || 'https://placehold.co/40x40.png',
    };
    setTenants([...tenants, newTenant]);
    setOpen(false);
    setPreviewImage(null);
    toast({
      title: 'Tenant Added',
      description: `${newTenant.name} has been successfully added.`,
    });
  };

  const getStatusBadge = (status: Tenant['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-success text-success-foreground hover:bg-success/80';
      case 'Pending':
        return 'bg-warning text-warning-foreground hover:bg-warning/80';
      case 'Overdue':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      default:
        return '';
    }
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold text-primary">RentFlow</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <Link href="/">
                  <HomeIcon />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Properties">
                <Building2 />
                Properties
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Tenants" isActive>
                <Link href="/tenants">
                  <Users />
                  Tenants
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Payments">
                <DollarSign />
                Payments
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Reports">
                <LineChart />
                Reports
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Tenants</h1>
          </div>
          <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tenants..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar"/>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tenants</CardTitle>
                <CardDescription>
                  Manage your tenants and their information.
                </CardDescription>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Add Tenant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Tenant</DialogTitle>
                    <DialogDescription>
                      Fill in the form below to add a new tenant.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTenant} className="space-y-4">
                    <div className="space-y-2">
                       <Label>Tenant Photo</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={previewImage ?? "https://placehold.co/80x80.png"} data-ai-hint="person avatar"/>
                                <AvatarFallback><ImageIcon className="text-muted-foreground"/></AvatarFallback>
                            </Avatar>
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Upload Image
                            </Button>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property">Property</Label>
                      <Input id="property" name="property" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rent">Rent Amount</Label>
                      <Input
                        id="rent"
                        name="rent"
                        type="number"
                        required
                        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                         <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Save Tenant</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Property
                    </TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={tenant.avatar}
                              alt={tenant.name}
                              data-ai-hint="person avatar"
                            />
                            <AvatarFallback>
                              {tenant.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{tenant.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {tenant.property}
                      </TableCell>
                      <TableCell>${tenant.rent.toFixed(2)}</TableCell>
                      <TableCell>{tenant.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(tenant.status)}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
