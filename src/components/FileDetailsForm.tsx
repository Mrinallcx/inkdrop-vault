import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TagsInput } from '@/components/ui/tags-input';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  // Basic Information
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['draft', 'in-review', 'approved', 'completed', 'archived']),
  
  // Project Details
  projectName: z.string().optional(),
  projectPhase: z.string().optional(),
  dueDate: z.date().optional(),
  startDate: z.date().optional(),
  estimatedHours: z.string().optional(),
  actualHours: z.string().optional(),
  
  // Team & Collaboration
  department: z.string().min(1, 'Please select a department'),
  assignee: z.string().optional(),
  reviewer: z.string().optional(),
  approver: z.string().optional(),
  stakeholders: z.array(z.string()),
  teamSize: z.string().optional(),
  
  // Financial
  budget: z.string().optional(),
  costCenter: z.string().optional(),
  currency: z.string().optional(),
  invoiceNumber: z.string().optional(),
  
  // File Metadata
  version: z.string().optional(),
  language: z.string().optional(),
  fileSource: z.string().optional(),
  confidentialityLevel: z.enum(['public', 'internal', 'confidential', 'restricted']),
  retentionPeriod: z.string().optional(),
  
  // Settings & Permissions
  tags: z.array(z.string()),
  isPublic: z.boolean(),
  allowComments: z.boolean(),
  allowDownload: z.boolean(),
  requireApproval: z.boolean(),
  enableVersioning: z.boolean(),
  
  // Notifications & Integration
  notifyOnChanges: z.boolean(),
  emailNotifications: z.array(z.string()),
  integrationPlatform: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  
  // Custom Fields
  customField1: z.string().optional(),
  customField2: z.string().optional(),
  customField3: z.string().optional(),
  
  // Additional Information
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  clientRequirements: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FileDetailsFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const FileDetailsForm: React.FC<FileDetailsFormProps> = ({ onSubmit, onCancel }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      subcategory: '',
      priority: 'medium',
      status: 'draft',
      projectName: '',
      projectPhase: '',
      estimatedHours: '',
      actualHours: '',
      department: '',
      assignee: '',
      reviewer: '',
      approver: '',
      stakeholders: [],
      teamSize: '',
      budget: '',
      costCenter: '',
      currency: 'USD',
      invoiceNumber: '',
      version: '1.0',
      language: 'English',
      fileSource: '',
      confidentialityLevel: 'internal',
      retentionPeriod: '',
      tags: [],
      isPublic: false,
      allowComments: true,
      allowDownload: true,
      requireApproval: false,
      enableVersioning: true,
      notifyOnChanges: false,
      emailNotifications: [],
      integrationPlatform: '',
      webhookUrl: '',
      customField1: '',
      customField2: '',
      customField3: '',
      notes: '',
      internalNotes: '',
      clientRequirements: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    onSubmit(data);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card border rounded-xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">File Details</h2>
            <p className="text-muted-foreground">Provide additional information about your uploaded files</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onCancel}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter file title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="in-review">In Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="documents">Documents</SelectItem>
                          <SelectItem value="images">Images</SelectItem>
                          <SelectItem value="videos">Videos</SelectItem>
                          <SelectItem value="presentations">Presentations</SelectItem>
                          <SelectItem value="spreadsheets">Spreadsheets</SelectItem>
                          <SelectItem value="contracts">Contracts</SelectItem>
                          <SelectItem value="reports">Reports</SelectItem>
                          <SelectItem value="marketing">Marketing Materials</SelectItem>
                          <SelectItem value="training">Training Materials</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subcategory */}
                <FormField
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategory</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter subcategory..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confidentiality Level */}
                <FormField
                  control={form.control}
                  name="confidentialityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidentiality Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                          <SelectItem value="confidential">Confidential</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the content and purpose of these files..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description to help others understand the content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Project Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project Phase */}
                <FormField
                  control={form.control}
                  name="projectPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Phase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select phase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="testing">Testing</SelectItem>
                          <SelectItem value="deployment">Deployment</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick start date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick due date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Optional deadline for this file or project.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estimated Hours */}
                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 40" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actual Hours */}
                <FormField
                  control={form.control}
                  name="actualHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Hours</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 35" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Team & Collaboration Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Team & Collaboration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Department */}
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="it">IT</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Team Size */}
                <FormField
                  control={form.control}
                  name="teamSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-2">1-2 people</SelectItem>
                          <SelectItem value="3-5">3-5 people</SelectItem>
                          <SelectItem value="6-10">6-10 people</SelectItem>
                          <SelectItem value="11-20">11-20 people</SelectItem>
                          <SelectItem value="20+">20+ people</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Assignee */}
                <FormField
                  control={form.control}
                  name="assignee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignee</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign to someone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="john.doe">John Doe</SelectItem>
                          <SelectItem value="jane.smith">Jane Smith</SelectItem>
                          <SelectItem value="mike.johnson">Mike Johnson</SelectItem>
                          <SelectItem value="sarah.wilson">Sarah Wilson</SelectItem>
                          <SelectItem value="david.brown">David Brown</SelectItem>
                          <SelectItem value="emily.davis">Emily Davis</SelectItem>
                          <SelectItem value="alex.martinez">Alex Martinez</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reviewer */}
                <FormField
                  control={form.control}
                  name="reviewer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reviewer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign reviewer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manager1">Sarah Thompson (Manager)</SelectItem>
                          <SelectItem value="lead1">Mark Roberts (Team Lead)</SelectItem>
                          <SelectItem value="senior1">Lisa Chen (Senior)</SelectItem>
                          <SelectItem value="director1">James Wilson (Director)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Approver */}
                <FormField
                  control={form.control}
                  name="approver"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approver</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select approver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ceo">CEO - Robert Johnson</SelectItem>
                          <SelectItem value="cto">CTO - Maria Rodriguez</SelectItem>
                          <SelectItem value="vp-eng">VP Engineering - Tom Lee</SelectItem>
                          <SelectItem value="vp-sales">VP Sales - Jennifer Walsh</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Stakeholders */}
              <FormField
                control={form.control}
                name="stakeholders"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stakeholders</FormLabel>
                    <FormControl>
                      <TagsInput 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Add stakeholder names or emails..."
                      />
                    </FormControl>
                    <FormDescription>
                      Add stakeholders who should be notified about this project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Financial Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Budget */}
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $5,000" {...field} />
                      </FormControl>
                      <FormDescription>Associated budget for this project.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cost Center */}
                <FormField
                  control={form.control}
                  name="costCenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Center</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CC-2024-MKT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invoice Number */}
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., INV-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Metadata Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">File Metadata</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Version */}
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                          <SelectItem value="Chinese">Chinese</SelectItem>
                          <SelectItem value="Japanese">Japanese</SelectItem>
                          <SelectItem value="Portuguese">Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Source */}
                <FormField
                  control={form.control}
                  name="fileSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal">Internal Creation</SelectItem>
                          <SelectItem value="client">Client Provided</SelectItem>
                          <SelectItem value="vendor">Vendor/Contractor</SelectItem>
                          <SelectItem value="partner">Partner Organization</SelectItem>
                          <SelectItem value="public">Public Source</SelectItem>
                          <SelectItem value="purchased">Purchased/Licensed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Retention Period */}
                <FormField
                  control={form.control}
                  name="retentionPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retention Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-year">1 Year</SelectItem>
                          <SelectItem value="2-years">2 Years</SelectItem>
                          <SelectItem value="3-years">3 Years</SelectItem>
                          <SelectItem value="5-years">5 Years</SelectItem>
                          <SelectItem value="7-years">7 Years</SelectItem>
                          <SelectItem value="permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagsInput 
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add tags to categorize your files..."
                    />
                  </FormControl>
                  <FormDescription>
                    Add relevant tags to make your files easier to find and organize.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Settings & Permissions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Settings & Permissions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Permissions */}
                <div className="space-y-4">
                  <h4 className="font-medium">File Permissions</h4>
                  
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Make files public</FormLabel>
                          <FormDescription>
                            Allow others in your organization to view these files.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowComments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Allow comments</FormLabel>
                          <FormDescription>
                            Enable commenting on this file.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowDownload"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Allow download</FormLabel>
                          <FormDescription>
                            Permit users to download this file.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Workflow Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Workflow Settings</h4>
                  
                  <FormField
                    control={form.control}
                    name="requireApproval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Require approval</FormLabel>
                          <FormDescription>
                            File changes require approval before publishing.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableVersioning"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable versioning</FormLabel>
                          <FormDescription>
                            Keep track of file versions and changes.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notifyOnChanges"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notify on changes</FormLabel>
                          <FormDescription>
                            Send notifications when file is modified.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Integration & Notifications Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Integration & Notifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Integration Platform */}
                <FormField
                  control={form.control}
                  name="integrationPlatform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Integration Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="slack">Slack</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="discord">Discord</SelectItem>
                          <SelectItem value="jira">Jira</SelectItem>
                          <SelectItem value="confluence">Confluence</SelectItem>
                          <SelectItem value="notion">Notion</SelectItem>
                          <SelectItem value="trello">Trello</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Webhook URL */}
                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://hooks.slack.com/services/..." 
                          type="url"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional webhook for external notifications.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Notifications */}
              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Notifications</FormLabel>
                    <FormControl>
                      <TagsInput 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Add email addresses for notifications..."
                      />
                    </FormControl>
                    <FormDescription>
                      Add email addresses to receive notifications about this file.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Custom Fields</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="customField1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Field 1</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom value..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customField2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Field 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom value..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customField3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Field 3</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom value..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Additional Information</h3>
              
              <div className="space-y-4">
                {/* Additional Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information or special instructions..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Internal Notes */}
                <FormField
                  control={form.control}
                  name="internalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Internal notes (not visible to external parties)..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        These notes are only visible to internal team members.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Client Requirements */}
                <FormField
                  control={form.control}
                  name="clientRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Specific client requirements or specifications..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Document any specific requirements from the client or external stakeholders.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button type="submit" className="min-w-[120px]">
                <Save className="w-4 h-4 mr-2" />
                Save Details
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default FileDetailsForm;