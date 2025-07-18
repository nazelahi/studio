

"use client"

import * as React from "react"
import { useAppContext } from "@/context/app-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useProtection } from "@/context/protection-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Edit, Trash2, LoaderCircle, Upload, Image as ImageIcon, FileText, Download, Briefcase, X } from "lucide-react"
import { saveDocumentAction, deleteDocumentAction } from "@/app/actions/documents"
import type { Document as DocType, Tenant } from "@/types"
import { Skeleton } from "./ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { generateDocumentDescription } from "@/ai/flows/generate-document-description-flow"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"

type StagedFile = {
  id: string;
  file: File;
  previewUrl: string;
  description: string;
  isGenerating: boolean;
};

export function DocumentsTab() {
  const { documents, tenants, loading, settings } = useAppContext();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<DocType | null>(null);
  const [isPending, startTransition] = React.useTransition();
  
  const [stagedFiles, setStagedFiles] = React.useState<StagedFile[]>([]);
  
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const docFileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [category, setCategory] = React.useState('');
  const [customCategory, setCustomCategory] = React.useState('');
  
  React.useEffect(() => {
    const categories = settings.documentCategories || [];
    if (editingDoc) {
        const docCategory = editingDoc.category || '';
        if (categories.includes(docCategory)) {
            setCategory(docCategory);
            setCustomCategory('');
        } else if (docCategory) {
            setCategory('Other');
            setCustomCategory(docCategory);
        } else {
            setCategory('');
            setCustomCategory('');
        }
    } else {
        setCategory(categories[0] || '');
    }
  }, [editingDoc, settings.documentCategories]);


  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingDoc(null);
      setDocFile(null);
      setStagedFiles([]);
      setCategory((settings.documentCategories || [])[0] || '');
      setCustomCategory('');
    }
    setIsDialogOpen(isOpen);
  };
  
  const handleEdit = (doc: DocType, e: React.MouseEvent) => {
    e.stopPropagation();
    withProtection(() => {
      setEditingDoc(doc);
      setIsDialogOpen(true);
    }, e);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const finalCategory = category === 'Other' ? customCategory : category;
    if (!finalCategory) {
        toast({ title: "Category is required", description: "Please select or enter a category.", variant: "destructive" });
        return;
    }
    formData.set('category', finalCategory);

    if (editingDoc) {
        if (docFile) formData.append('documentFile', docFile);
    } else {
        if (stagedFiles.length === 0) {
            toast({ title: "No files to upload", description: "Please select at least one document.", variant: "destructive" });
            return;
        }
        stagedFiles.forEach(sf => {
            formData.append('documentFiles', sf.file);
            formData.append('descriptions', sf.description);
        });
    }

    startTransition(async () => {
      const result = await saveDocumentAction(formData);
      if (result.error) {
        toast({ title: 'Error saving document(s)', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: editingDoc ? 'Document Updated' : 'Document(s) Added', description: 'Your documents have been saved successfully.' });
        handleOpenChange(false);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, doc: DocType) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('documentId', doc.id);
    formData.append('fileUrl', doc.file_url);
    
    withProtection(() => {
      startTransition(async () => {
        const result = await deleteDocumentAction(formData);
        if (result.error) {
          toast({ title: 'Error deleting document', description: result.error, variant: 'destructive' });
        } else {
          toast({ title: 'Document Deleted', description: 'The document has been removed.' });
        }
      });
    }, e);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingDoc) {
        const file = e.target.files?.[0];
        if (file) setDocFile(file);
    } else {
        handleMultipleFiles(e.target.files);
    }
  };

  const handleMultipleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);

    const newStagedFiles: StagedFile[] = newFiles.map(file => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
        description: 'Generating description...',
        isGenerating: true,
    }));

    setStagedFiles(prev => [...prev, ...newStagedFiles]);

    newStagedFiles.forEach(stagedFile => {
        if (stagedFile.file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(stagedFile.file);
            reader.onload = async () => {
                const photoDataUri = reader.result as string;
                try {
                    const result = await generateDocumentDescription({ photoDataUri });
                    updateStagedFile(stagedFile.id, { description: result.description, isGenerating: false });
                } catch (error) {
                    console.error('AI description generation failed:', error);
                    updateStagedFile(stagedFile.id, { description: stagedFile.file.name, isGenerating: false });
                }
            };
        } else {
             updateStagedFile(stagedFile.id, { description: stagedFile.file.name, isGenerating: false });
        }
    });
  };
  
  const updateStagedFile = (id: string, updates: Partial<StagedFile>) => {
    setStagedFiles(prev => prev.map(sf => sf.id === id ? { ...sf, ...updates } : sf));
  };
  
  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(sf => sf.id !== id));
  };
  
  const tenantsWithDocs = React.useMemo(() => {
    return tenants
        .filter(tenant => tenant.documents && tenant.documents.length > 0)
        .map(tenant => {
            const docs: DocType[] = (tenant.documents || []).map(docUrl => ({
                id: tenant.id, // The tenant ID is sufficient here for a temporary ID
                file_url: docUrl,
                file_name: docUrl.split('/').pop() || 'Tenant Document',
                file_type: docUrl.toLowerCase().includes('.pdf') ? 'application/pdf' : 'image/jpeg',
                category: tenant.name,
                description: `Document for ${tenant.name}`,
                created_at: tenant.created_at || new Date().toISOString(),
                isTenantDoc: true,
            }));
            return { ...tenant, docs };
        })
        .sort((a,b) => a.name.localeCompare(b.name));
  }, [tenants]);

  const allDocuments = React.useMemo(() => {
    return [...documents].sort((a,b) => (a.created_at || '').localeCompare(b.created_at || '')).reverse();
  }, [documents]);


  const documentCategories = React.useMemo(() => {
    const categories = new Set(allDocuments.map(d => d.category));
    return Array.from(categories);
  }, [allDocuments]);


  const DocumentRow = ({ doc }: { doc: DocType }) => (
    <TableRow>
        <TableCell className="w-16 p-2">
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="block">
                 <div className="flex-shrink-0 w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                    {doc.file_type.startsWith('image/') ? (
                        <img src={doc.file_url} alt={doc.description || doc.file_name} className="h-full w-full object-cover" data-ai-hint="document" />
                    ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                </div>
            </a>
        </TableCell>
        <TableCell>
             <p className="text-sm font-medium" title={doc.description || doc.file_name}>
                {doc.description}
            </p>
        </TableCell>
        <TableCell className="hidden md:table-cell">
            <p className="text-sm text-muted-foreground">{doc.created_at ? format(parseISO(doc.created_at), 'dd MMM, yyyy') : '-'}</p>
        </TableCell>
        <TableCell>
          {doc.isTenantDoc ? (
              <Badge variant="secondary">Tenant Upload</Badge>
          ) : (
              <Badge variant="outline">{doc.category}</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download={doc.file_name}>
                        <Download className="h-4 w-4" />
                    </a>
                </Button>
                {isAdmin && !doc.isTenantDoc && (
                    <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(doc, e)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action will permanently delete this document. This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => handleDelete(e, doc)} disabled={isPending}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </div>
        </TableCell>
    </TableRow>
  );

  const DocumentTable = ({ docs }: { docs: DocType[] }) => (
    <Table>
        <TableHeader>
            <TableRow style={{ backgroundColor: 'hsl(var(--table-header-background))', color: 'hsl(var(--table-header-foreground))' }} className="hover:bg-[hsl(var(--table-header-background)/0.9)]">
                <TableHead className="w-16 p-2 text-inherit">Preview</TableHead>
                <TableHead className="text-inherit">Description</TableHead>
                <TableHead className="hidden md:table-cell text-inherit">Date</TableHead>
                <TableHead className="text-inherit">Category</TableHead>
                <TableHead className="text-right text-inherit">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {docs.length > 0 ? (
                docs.map((doc, index) => <DocumentRow key={`${doc.id}-${doc.file_url}-${index}`} doc={doc} />)
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No documents found.</TableCell>
                </TableRow>
            )}
        </TableBody>
    </Table>
  );


  return (
    <div className="pt-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
                <CardTitle>Document Center</CardTitle>
                <CardDescription>Manage all your property-related documents in one place.</CardDescription>
            </div>
            {isAdmin && (
                <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Document(s)
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0">
                      <form onSubmit={handleSave}>
                        <DialogHeader className="p-6 pb-4">
                            <DialogTitle>{editingDoc ? 'Edit Document' : 'Add New Documents'}</DialogTitle>
                        </DialogHeader>
                          <div className="grid gap-4 px-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>
                                            {(settings.documentCategories || []).map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                            <SelectItem value="Other">Other (specify)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {category === 'Other' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="customCategory">Custom Category Name</Label>
                                        <Input 
                                            id="customCategory" 
                                            value={customCategory}
                                            onChange={e => setCustomCategory(e.target.value)}
                                            placeholder="Enter custom category"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                           
                            {editingDoc ? (
                                <>
                                    <input type="hidden" name="documentId" value={editingDoc.id} />
                                    {editingDoc.file_url && <input type="hidden" name="oldFileUrl" value={editingDoc.file_url} />}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description (Optional)</Label>
                                            <Textarea id="description" name="description" defaultValue={editingDoc?.description || ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>File</Label>
                                            <div className="flex items-center gap-4">
                                                <Button type="button" variant="outline" onClick={() => docFileInputRef.current?.click()}>
                                                    <Upload className="mr-2 h-4 w-4"/>
                                                    Change File
                                                </Button>
                                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{docFile ? docFile.name : editingDoc.file_name}</p>
                                            </div>
                                            <Input ref={docFileInputRef} name="documentFile" type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div 
                                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                      onClick={() => docFileInputRef.current?.click()}
                                    >
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                                        <p className="mt-2 text-sm font-medium">Click to upload or drag & drop</p>
                                        <p className="text-xs text-muted-foreground">You can select multiple files</p>
                                        <Input ref={docFileInputRef} type="file" className="hidden" multiple accept="image/*,.pdf" onChange={handleFileChange} />
                                    </div>
                                    
                                    {stagedFiles.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t">
                                            {stagedFiles.map((sf, index) => (
                                                <div key={sf.id} className="flex items-start gap-4 p-3 border rounded-md bg-background">
                                                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                                        {sf.file.type.startsWith('image/') ? (
                                                            <img src={sf.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <Textarea 
                                                            name={`description-${index}`}
                                                            value={sf.description}
                                                            onChange={(e) => updateStagedFile(sf.id, { description: e.target.value })}
                                                            placeholder="Enter a description..."
                                                            rows={2}
                                                            disabled={sf.isGenerating}
                                                        />
                                                         {sf.isGenerating && <p className="text-xs text-muted-foreground flex items-center gap-1"><LoaderCircle className="h-3 w-3 animate-spin"/>Generating description...</p>}
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleRemoveStagedFile(sf.id)}>
                                                        <X className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                          </div>
                           <DialogFooter className="p-6 pt-4 border-t bg-muted/50">
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isPending}>Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isPending || stagedFiles.some(f => f.isGenerating)}>
                                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                {editingDoc ? 'Save Changes' : `Save ${stagedFiles.length} Document(s)`}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className="space-y-4 p-6">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto h-auto p-4">
                    <TabsTrigger value="all">All Documents</TabsTrigger>
                    {documentCategories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                    {tenantsWithDocs.length > 0 && <TabsTrigger value="tenants">Tenant Documents</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-0">
                    <DocumentTable docs={allDocuments} />
                  </TabsContent>

                  {documentCategories.map(category => (
                    <TabsContent key={category} value={category} className="mt-0">
                       <DocumentTable docs={allDocuments.filter(d => d.category === category)} />
                    </TabsContent>
                  ))}

                  <TabsContent value="tenants" className="mt-4 p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tenantsWithDocs.map((tenant) => (
                           <Dialog key={tenant.id}>
                                <DialogTrigger asChild>
                                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={tenant.avatar} />
                                                <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{tenant.name}</p>
                                                <p className="text-sm text-muted-foreground">{tenant.property}</p>
                                                <p className="text-xs text-muted-foreground">{tenant.docs.length} document(s)</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Documents for {tenant.name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
                                      <DocumentTable docs={tenant.docs} />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">Close</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                           </Dialog>
                        ))}
                      </div>
                  </TabsContent>
                </Tabs>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
