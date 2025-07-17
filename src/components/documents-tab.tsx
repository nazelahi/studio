
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
import { PlusCircle, Edit, Trash2, LoaderCircle, Upload, Image as ImageIcon, FileText, Download } from "lucide-react"
import { saveDocumentAction, deleteDocumentAction } from "@/app/actions/documents"
import type { Document } from "@/types"
import { Skeleton } from "./ui/skeleton"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { saveAs } from "file-saver"

const documentCategories = ["Legal", "Agreements", "Receipts", "ID Cards", "Property Deeds", "Blueprints", "Miscellaneous"];

export function DocumentsTab() {
  const { documents, loading } = useData();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { withProtection } = useProtection();

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<Document | null>(null);
  const [isPending, startTransition] = React.useTransition();
  
  const [docPreview, setDocPreview] = React.useState<string | null>(null);
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const docFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setEditingDoc(null);
      setDocFile(null);
      setDocPreview(null);
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
    return documents.reduce((acc, doc) => {
      const category = doc.category || 'Miscellaneous';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
  }, [documents]);

  const allImages = React.useMemo(() => documents.filter(doc => doc.file_type && doc.file_type.startsWith('image/')), [documents]);

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
                                <Input id="category" name="category" list="doc-categories" defaultValue={editingDoc?.category} required />
                                <datalist id="doc-categories">
                                    {documentCategories.map(cat => <option key={cat} value={cat} />)}
                                </datalist>
                            </div>
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
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-40 w-full" />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No documents uploaded yet.</div>
            ) : (
                <div className="space-y-8">
                    {allImages.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Image Gallery</CardTitle></CardHeader>
                            <CardContent>
                                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                                    <CarouselContent>
                                        {allImages.map((doc) => (
                                            <CarouselItem key={doc.id} className="md:basis-1/2 lg:basis-1/3">
                                                <div className="p-1">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                          <Card className="overflow-hidden cursor-pointer group">
                                                              <div className="aspect-video bg-muted flex items-center justify-center">
                                                                <img src={doc.file_url} alt={doc.description || doc.file_name} className="w-full h-full object-cover transition-transform group-hover:scale-105" data-ai-hint="document"/>
                                                              </div>
                                                              <CardFooter className="p-3 text-sm">
                                                                <p className="font-semibold truncate">{doc.description || doc.file_name}</p>
                                                              </CardFooter>
                                                          </Card>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none">
                                                            <DialogHeader>
                                                                <DialogTitle className="sr-only">{doc.description || doc.file_name}</DialogTitle>
                                                            </DialogHeader>
                                                            <img src={doc.file_url} alt={doc.description || doc.file_name} className="w-full h-auto rounded-lg" data-ai-hint="document"/>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            </CardContent>
                        </Card>
                    )}

                    {Object.keys(groupedDocuments).length > 0 ? Object.entries(groupedDocuments).map(([category, docs]) => (
                        <div key={category}>
                            <h3 className="text-lg font-semibold mb-2">{category}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {docs.map(doc => (
                                    <Card key={doc.id} className="group">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            {doc.file_type.startsWith('image/') ? (
                                                 <img src={doc.file_url} alt={doc.file_name} className="w-16 h-16 object-cover rounded-md" data-ai-hint="document"/>
                                            ) : (
                                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-semibold truncate">{doc.file_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{doc.description || "No description"}</p>
                                            </div>
                                        </CardContent>
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
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
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
                        </div>
                    )) : !loading && <div className="text-center py-10 text-muted-foreground">No documents found.</div>}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
