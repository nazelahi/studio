
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calculator, Info, Coins, Banknote, Building, Landmark, Hand, Shield, Wallet, Scale } from "lucide-react"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount).replace('BDT', '৳');
};

const ZAKAT_RATE = 0.025; // 2.5%

const AssetItem = ({ icon: Icon, label, id, value, onChange }: { icon: React.ElementType, label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 w-1/3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor={id} className="whitespace-nowrap">{label}</Label>
        </div>
        <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
            <Input
                type="number"
                id={id}
                value={value}
                onChange={onChange}
                placeholder="0.00"
                className="pl-7"
            />
        </div>
    </div>
);


export function ZakatCalculator() {
    const [assets, setAssets] = React.useState({
        cash: '',
        bank: '',
        gold: '',
        silver: '',
        investments: '',
        businessInventory: '',
    });
    const [liabilities, setLiabilities] = React.useState({
        shortTerm: '',
    });
    const [nisab, setNisab] = React.useState('50000'); // Default placeholder Nisab
    const [zakatDue, setZakatDue] = React.useState<number | null>(null);

    const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setAssets(prev => ({ ...prev, [id]: value }));
    };

    const handleLiabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLiabilities(prev => ({ ...prev, [id]: value }));
    };

    const calculateZakat = () => {
        const totalAssets = Object.values(assets).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
        const totalLiabilities = Object.values(liabilities).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
        const netWorth = totalAssets - totalLiabilities;
        const nisabValue = parseFloat(nisab) || 0;

        if (netWorth >= nisabValue) {
            setZakatDue(netWorth * ZAKAT_RATE);
        } else {
            setZakatDue(0);
        }
    };
    
    const totalAssets = Object.values(assets).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const totalLiabilities = Object.values(liabilities).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    const nisabValue = parseFloat(nisab) || 0;


    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle>Zakat Calculator</CardTitle>
                        <CardDescription>Calculate your annual Zakat obligation.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Wallet/> Zakatable Assets</h3>
                    <AssetItem icon={Coins} label="Cash in Hand" id="cash" value={assets.cash} onChange={handleAssetChange} />
                    <AssetItem icon={Landmark} label="Bank Balance" id="bank" value={assets.bank} onChange={handleAssetChange} />
                    <AssetItem icon={Coins} label="Gold Value" id="gold" value={assets.gold} onChange={handleAssetChange} />
                    <AssetItem icon={Coins} label="Silver Value" id="silver" value={assets.silver} onChange={handleAssetChange} />
                    <AssetItem icon={Banknote} label="Investments/Shares" id="investments" value={assets.investments} onChange={handleAssetChange} />
                    <AssetItem icon={Building} label="Business Inventory" id="businessInventory" value={assets.businessInventory} onChange={handleAssetChange} />
                </div>
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Hand/> Liabilities</h3>
                     <AssetItem icon={Shield} label="Short-term Debts" id="shortTerm" value={liabilities.shortTerm} onChange={handleLiabilityChange} />
                     <div className="pt-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Scale/> Nisab Threshold</h3>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 w-1/3">
                                <Info className="h-5 w-5 text-muted-foreground" />
                                <Label htmlFor="nisab">Nisab Value</Label>
                            </div>
                            <div className="relative flex-grow">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                                <Input
                                    type="number"
                                    id="nisab"
                                    value={nisab}
                                    onChange={(e) => setNisab(e.target.value)}
                                    placeholder="e.g. 50000"
                                    className="pl-7"
                                />
                            </div>
                        </div>
                         <p className="text-xs text-muted-foreground mt-2 ml-1">The minimum wealth required for Zakat. This is the market value of 87.48g of gold or 612.36g of silver.</p>
                     </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4 pt-6">
                <div className="w-full space-y-4">
                    <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                        <span className="font-medium">Total Zakatable Assets:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalAssets)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                        <span className="font-medium">Total Liabilities:</span>
                        <span className="font-bold text-red-600">-{formatCurrency(totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                        <span className="font-medium text-primary">Net Worth for Zakat:</span>
                        <span className="font-bold text-primary">{formatCurrency(netWorth)}</span>
                    </div>
                </div>
                
                 <div className="w-full flex justify-center mt-4">
                    <Button onClick={calculateZakat} size="lg">
                        <Calculator className="mr-2 h-5 w-5" /> Calculate Zakat
                    </Button>
                 </div>

                {zakatDue !== null && (
                    <Alert className={`w-full mt-6 ${zakatDue > 0 ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
                        {zakatDue > 0 ? (
                           <>
                            <AlertTitle className="text-green-800">Zakat is Obligatory</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Your net worth of <strong>{formatCurrency(netWorth)}</strong> is above the Nisab threshold of <strong>{formatCurrency(nisabValue)}</strong>.
                                <div className="mt-4 text-center">
                                    <p className="text-lg">Your total Zakat due is:</p>
                                    <p className="text-3xl font-bold">{formatCurrency(zakatDue)}</p>
                                </div>
                            </AlertDescription>
                           </>
                        ) : (
                           <>
                             <AlertTitle className="text-yellow-800">Zakat Not Due</AlertTitle>
                            <AlertDescription className="text-yellow-700">
                                Your net worth of <strong>{formatCurrency(netWorth)}</strong> is below the Nisab threshold of <strong>{formatCurrency(nisabValue)}</strong>. Zakat is not currently obligatory for you.
                            </AlertDescription>
                           </>
                        )}
                    </Alert>
                )}
            </CardFooter>
        </Card>
    )
}
