

"use client"

import * as React from "react"
import { useData } from "@/context/data-context"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useProtection } from "@/context/protection-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Edit, Trash2, LoaderCircle, Upload, Image as ImageIcon, FileText, Download, Folder } from "lucide-react"
import { saveDocumentAction, deleteDocumentAction } from "@/app/actions/documents"
import type { Document } from "@/types"
import { Skeleton } from "./ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/context/settings-context"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"


export function DocumentsTab() {
  const { documents, loading } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();
  const { settings } = useSettings();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<Document | null>(null);
  const [isPending, startTransition] = React.useTransition();
  
  const [docPreview, setDocPreview] = React.useState<string | null>(null);
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
      setDocPreview(null);
      setCategory((settings.documentCategories || [])[0] || '');
      setCustomCategory('');
    }
    setIsDialogOpen(isOpen);
  };
  
  const handleEdit = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    withProtection(() => {
      setEditingDoc(doc);
      setDocPreview(doc.file_url);
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

    if (docFile) {
        formData.append('documentFile', docFile);
    }
    if (editingDoc) {
      formData.set('file_url', editingDoc.file_url)
      formData.set('file_type', editingDoc.file_type)
      formData.set('file_name', editingDoc.file_name)
    }

    startTransition(async () => {
      const result = await saveDocumentAction(formData);
      if (result.error) {
        toast({ title: 'Error saving document', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: editingDoc ? 'Document Updated' : 'Document Added', description: 'The document has been saved successfully.' });
        handleOpenChange(false);
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, doc: Document) => {
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
    const file = e.target.files?.[0];
    if (file) {
        setDocFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDocPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setDocPreview(null); // No preview for non-image files like PDFs
        }
    }
  };

  const groupedDocuments = React.useMemo(() => {
    const orderedCategories = settings.documentCategories || [];
    const categoryOrder = orderedCategories.reduce((acc, cat, index) => {
        acc[cat] = index;
        return acc;
    }, {} as Record<string, number>);

    const groups = documents.reduce((acc, doc) => {
      const category = doc.category || 'Miscellaneous';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

    return Object.entries(groups).sort(([catA], [catB]) => {
        const orderA = categoryOrder[catA] ?? Infinity;
        const orderB = categoryOrder[catB] ?? Infinity;
        if (orderA !== Infinity || orderB !== Infinity) {
             return orderA - orderB;
        }
        return catA.localeCompare(catB); // Fallback for uncategorized items
    });

  }, [documents, settings.documentCategories]);

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
                            Add Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingDoc ? 'Edit Document' : 'Add New Document'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave}>
                          {editingDoc && <input type="hidden" name="documentId" value={editingDoc.id} />}
                          {editingDoc && <input type="hidden" name="oldFileUrl" value={editingDoc.file_url} />}
                          <div className="grid gap-4 py-4">
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

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea id="description" name="description" defaultValue={editingDoc?.description || ''} />
                            </div>
                            <div className="space-y-2">
                                <Label>File</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                                        {docPreview ? (
                                            <img src={docPreview} alt="Document Preview" className="h-full w-full object-contain rounded-md" data-ai-hint="document"/>
                                        ) : editingDoc?.file_type?.startsWith('image/') ? (
                                            <img src={editingDoc.file_url} alt="Document Preview" className="h-full w-full object-contain rounded-md" data-ai-hint="document"/>
                                        ) : docFile || editingDoc ? (
                                            <FileText className="h-10 w-10 text-muted-foreground" />
                                        ) : (
                                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Button type="button" variant="outline" onClick={() => docFileInputRef.current?.click()}>
                                          <Upload className="mr-2 h-4 w-4"/>
                                          {editingDoc ? 'Change File' : 'Upload File'}
                                      </Button>
                                      {docFile && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{docFile.name}</p>}
                                      {!docFile && editingDoc && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{editingDoc.file_name}</p>}
                                    </div>
                                    <Input ref={docFileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                                </div>
                            </div>
                          </div>
                           <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline" disabled={isPending}>Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isPending}>
                                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Save Document
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No documents uploaded yet.</div>
            ) : (
                <Accordion type="multiple" defaultValue={groupedDocuments.map(([category]) => category)} className="w-full">
                    {groupedDocuments.map(([category, docs]) => (
                        <AccordionItem key={category} value={category}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-lg font-semibold">
                                    <Folder className="h-5 w-5 text-primary"/>
                                    {category}
                                    <span className="text-sm font-normal text-muted-foreground">({docs.length})</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                                    {docs.map(doc => (
                                        <Card key={doc.id} className="group overflow-hidden">
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="block">
                                                <div className="aspect-video bg-muted flex items-center justify-center">
                                                     {doc.file_type.startsWith('image/') ? (
                                                        <img src={doc.file_url} alt={doc.file_name} className="w-full h-full object-cover transition-transform group-hover:scale-105" data-ai-hint="document"/>
                                                    ) : (
                                                        <FileText className="w-12 h-12 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </a>
                                            <CardHeader className="p-3">
                                                <CardTitle className="text-sm font-semibold truncate leading-tight" title={doc.description || doc.file_name}>
                                                    {doc.description || doc.file_name}
                                                </CardTitle>
                                                <CardDescription className="text-xs truncate">{doc.file_name}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="p-2 bg-muted/50 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download={doc.file_name}>
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                {isAdmin && (
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
                                                                <AlertDialogDescription>This action will permanently delete the document "{doc.file_name}". This cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={(e) => handleDelete(e, doc)} disabled={isPending}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    </>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
