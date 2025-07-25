

"use client"

import React, { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { updatePropertySettingsAction } from "./actions"
import { useAppContext } from "@/context/app-context"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoaderCircle, PlusCircle, Trash2, GripVertical, Sun, Moon } from "lucide-react"

const currencyOptions = [
    { value: "৳", label: "BDT (Bangladesh)" },
    { value: "$", label: "USD (United States)" },
    { value: "€", label: "EUR (Eurozone)" },
    { value: "£", label: "GBP (United Kingdom)" },
    { value: "₹", label: "INR (India)" },
    { value: "¥", label: "JPY (Japan)" },
    { value: "¥", label: "CNY (China)" },
    { value: "C$", label: "CAD (Canada)" },
    { value: "A$", label: "AUD (Australia)" },
    { value: "CHF", label: "CHF (Switzerland)" },
    { value: "RM", label: "MYR (Malaysia)" },
    { value: "S$", label: "SGD (Singapore)" },
    { value: "AED", label: "AED (UAE)" },
    { value: "SAR", label: "SAR (Saudi Arabia)" },
];

export default function ApplicationSettingsTab() {
  const { settings, setSettings, refreshData } = useAppContext();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [docCategories, setDocCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const handleDocCategoryChange = (index: number, value: string) => {
    const newCategories = [...docCategories];
    newCategories[index] = value;
    setDocCategories(newCategories);
  };
  
  const handleAddCategory = () => {
    if (newCategory && !docCategories.includes(newCategory)) {
        setDocCategories([...docCategories, newCategory]);
        setNewCategory('');
    }
  };

  const handleRemoveCategory = (index: number) => {
    const newCategories = docCategories.filter((_, i) => i !== index);
    setDocCategories(newCategories);
  };

  const handleSaveCategories = () => {
    startTransition(async () => {
        const formData = new FormData();
        docCategories.forEach(cat => formData.append('document_categories[]', cat));
        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Categories', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Categories Saved', description: 'Your document categories have been saved to the database.' });
            refreshData();
        }
    });
  };

  const handleSavePropertySettings = (field: string, value: any) => {
    startTransition(async () => {
        const formData = new FormData();
        const keyMap: {[key: string]: string} = {
            dateFormat: 'date_format',
            currencySymbol: 'currency_symbol',
            themePrimary: 'theme_primary',
            themeTableHeaderBackground: 'theme_table_header_background',
            themeTableHeaderForeground: 'theme_table_header_foreground',
            themeTableFooterBackground: 'theme_table_footer_background',
            themeMobileNavBackground: 'theme_mobile_nav_background',
            themeMobileNavForeground: 'theme_mobile_nav_foreground',
            themePrimaryDark: 'theme_primary_dark',
            themeTableHeaderBackgroundDark: 'theme_table_header_background_dark',
            themeTableHeaderForegroundDark: 'theme_table_header_foreground_dark',
            themeTableFooterBackgroundDark: 'theme_table_footer_background_dark',
            themeMobileNavBackgroundDark: 'theme_mobile_nav_background_dark',
            themeMobileNavForegroundDark: 'theme_mobile_nav_foreground_dark',
        };
        const mappedKey = keyMap[field] || field;
        formData.set(mappedKey, value);

        const result = await updatePropertySettingsAction(formData);
        if (result?.error) {
            toast({ title: 'Error Saving Setting', description: result.error, variant: 'destructive'});
        } else {
            toast({ title: 'Setting Saved', description: 'Your change has been saved to the database.' });
            refreshData();
        }
    });
  }
  
  const handleColorChange = (field: keyof typeof settings.theme.colors, value: string) => {
    setSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        colors: {
          ...prev.theme.colors,
          [field]: value,
        },
      },
    }));
  };
  
  const handleDarkColorChange = (field: keyof typeof settings.theme.darkColors, value: string) => {
    setSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        darkColors: {
          ...prev.theme.darkColors,
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Localization & Theme</CardTitle>
            <CardDescription>Customize date formats, currency, and the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select
                          value={settings.dateFormat}
                          onValueChange={(value) => handleSavePropertySettings('dateFormat', value)}
                      >
                          <SelectTrigger id="date-format">
                              <SelectValue placeholder="Select a format" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="dd MMM, yyyy">17 Jul, 2024</SelectItem>
                              <SelectItem value="MM/dd/yyyy">07/17/2024</SelectItem>
                              <SelectItem value="yyyy-MM-dd">2024-07-17</SelectItem>
                              <SelectItem value="MMMM dd, yyyy">July 17, 2024</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency-symbol">Currency Symbol</Label>
                    <Select
                      value={settings.currencySymbol}
                      onValueChange={(value) => handleSavePropertySettings('currencySymbol', value)}
                    >
                      <SelectTrigger id="currency-symbol">
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.label} value={option.value}>
                            {option.label} ({option.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              </div>
              
              <Separator className="my-6" />
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Sun className="h-5 w-5"/>Light Theme Colors</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="theme_primary">Primary</Label>
                          <Input id="theme_primary" name="theme_primary" type="color" 
                            value={settings.theme.colors.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themePrimary', e.target.value)} className="p-1 h-10"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="theme_table_header_background">Table Header</Label>
                          <Input id="theme_table_header_background" name="theme_table_header_background" type="color" 
                            value={settings.theme.colors.table_header_background}
                            onChange={(e) => handleColorChange('table_header_background', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeTableHeaderBackground', e.target.value)} className="p-1 h-10"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="theme_table_header_foreground">Table Header Text</Label>
                          <Input id="theme_table_header_foreground" name="theme_table_header_foreground" type="color" 
                            value={settings.theme.colors.table_header_foreground}
                            onChange={(e) => handleColorChange('table_header_foreground', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeTableHeaderForeground', e.target.value)} className="p-1 h-10"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="theme_table_footer_background">Table Footer</Label>
                          <Input id="theme_table_footer_background" name="theme_table_footer_background" type="color" 
                            value={settings.theme.colors.table_footer_background}
                            onChange={(e) => handleColorChange('table_footer_background', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeTableFooterBackground', e.target.value)} className="p-1 h-10"/>
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="theme_mobile_nav_background">Mobile Nav Bg</Label>
                          <Input id="theme_mobile_nav_background" name="theme_mobile_nav_background" type="color" 
                            value={settings.theme.colors.mobile_nav_background}
                            onChange={(e) => handleColorChange('mobile_nav_background', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeMobileNavBackground', e.target.value)} className="p-1 h-10"/>
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="theme_mobile_nav_foreground">Mobile Nav Text</Label>
                          <Input id="theme_mobile_nav_foreground" name="theme_mobile_nav_foreground" type="color" 
                            value={settings.theme.colors.mobile_nav_foreground}
                            onChange={(e) => handleColorChange('mobile_nav_foreground', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeMobileNavForeground', e.target.value)} className="p-1 h-10"/>
                      </div>
                  </div>
              </div>
              
               <Separator className="my-6" />
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Moon className="h-5 w-5"/>Dark Theme Colors</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="theme_primary_dark">Primary</Label>
                          <Input id="theme_primary_dark" name="theme_primary_dark" type="color" 
                            value={settings.theme.darkColors.primary}
                            onChange={(e) => handleDarkColorChange('primary', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themePrimaryDark', e.target.value)} className="p-1 h-10"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="theme_table_header_background_dark">Table Header</Label>
                          <Input id="theme_table_header_background_dark" name="theme_table_header_background_dark" type="color" 
                            value={settings.theme.darkColors.table_header_background}
                            onChange={(e) => handleDarkColorChange('table_header_background', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeTableHeaderBackgroundDark', e.target.value)} className="p-1 h-10"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="theme_table_header_foreground_dark">Table Header Text</Label>
                          <Input id="theme_table_header_foreground_dark" name="theme_table_header_foreground_dark" type="color" 
                            value={settings.theme.darkColors.table_header_foreground}
                            onChange={(e) => handleDarkColorChange('table_header_foreground', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeTableHeaderForegroundDark', e.target.value)} className="p-1 h-10"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="theme_table_footer_background_dark">Table Footer</Label>
                          <Input id="theme_table_footer_background_dark" name="theme_table_footer_background_dark" type="color" 
                            value={settings.theme.darkColors.table_footer_background}
                            onChange={(e) => handleDarkColorChange('table_footer_background', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeTableFooterBackgroundDark', e.target.value)} className="p-1 h-10"/>
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="theme_mobile_nav_background_dark">Mobile Nav Bg</Label>
                          <Input id="theme_mobile_nav_background_dark" name="theme_mobile_nav_background_dark" type="color" 
                            value={settings.theme.darkColors.mobile_nav_background}
                            onChange={(e) => handleDarkColorChange('mobile_nav_background', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeMobileNavBackgroundDark', e.target.value)} className="p-1 h-10"/>
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="theme_mobile_nav_foreground_dark">Mobile Nav Text</Label>
                          <Input id="theme_mobile_nav_foreground_dark" name="theme_mobile_nav_foreground_dark" type="color" 
                            value={settings.theme.darkColors.mobile_nav_foreground}
                            onChange={(e) => handleDarkColorChange('mobile_nav_foreground', e.target.value)}
                            onBlur={(e) => handleSavePropertySettings('themeMobileNavForegroundDark', e.target.value)} className="p-1 h-10"/>
                      </div>
                  </div>
              </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Document Categories</CardTitle>
                <CardDescription>Manage the list of categories used for organizing documents. This is saved to the database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {(docCategories || []).map((category, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Input
                                value={category}
                                onChange={(e) => handleDocCategoryChange(index, e.target.value)}
                                className="flex-1"
                            />
                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveCategory(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="New category name..."
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddCategory}><PlusCircle className="mr-2" />Add</Button>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveCategories} disabled={isPending}>
                    {isPending && <LoaderCircle className="animate-spin mr-2" />}
                    Save Categories to Database
                </Button>
            </CardFooter>
        </Card>
    </div>
  )
}
