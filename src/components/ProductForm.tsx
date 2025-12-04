import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, 
  Link2, 
  Tag, 
  DollarSign, 
  Package, 
  Store,
  Clock,
  Loader2
} from "lucide-react";
import { ProductData } from "@/types/product";

interface ProductFormProps {
  onSubmit: (data: ProductData) => void;
  initialData?: Partial<ProductData>;
}

export function ProductForm({ onSubmit, initialData }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [storeName, setStoreName] = useState(initialData?.storeName || "");
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || "");
  const [discountPrice, setDiscountPrice] = useState(initialData?.discountPrice || "");
  const [hasCoupon, setHasCoupon] = useState(initialData?.hasCoupon ?? false);
  const [couponName, setCouponName] = useState(initialData?.couponName || "");
  const [productLink, setProductLink] = useState(initialData?.productLink || "");
  const [productImage, setProductImage] = useState<string | null>(initialData?.productImage || null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    initialData?.scheduledTime ? new Date(initialData.scheduledTime) : undefined
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Auto-fetch image when link is pasted
  useEffect(() => {
    if (productLink && productLink.startsWith("http")) {
      setIsLoadingImage(true);
      const timer = setTimeout(() => {
        // Simulate image fetch - in production, you'd use an API to get OG image
        fetchProductImage(productLink);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [productLink]);

  const fetchProductImage = async (url: string) => {
    try {
      // Using a placeholder approach - in production, use a server-side proxy
      // to fetch Open Graph images from the URL
      const domain = new URL(url).hostname;
      
      // For demo purposes, we'll use a generic product image
      // In production, you'd call an API that fetches the OG:image from the URL
      setProductImage(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    } catch (error) {
      console.error("Error fetching image:", error);
    } finally {
      setIsLoadingImage(false);
    }
  };

  const formatPrice = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let fullScheduledTime: Date | null = null;
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      fullScheduledTime = new Date(scheduledDate);
      fullScheduledTime.setHours(hours, minutes, 0, 0);
    }

    const productData: ProductData = {
      id: initialData?.id || crypto.randomUUID(),
      name,
      storeName,
      originalPrice,
      discountPrice,
      hasCoupon,
      couponName: hasCoupon ? couponName : "",
      productLink,
      productImage,
      scheduledTime: fullScheduledTime,
      createdAt: new Date(),
    };

    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Name */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: "0ms" }}>
        <Label htmlFor="name" className="flex items-center gap-2 text-foreground">
          <Package className="h-4 w-4 text-primary" />
          Nome do Produto
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Smartphone Samsung Galaxy S24"
          required
          className="h-12 bg-input border-border focus:border-primary"
        />
      </div>

      {/* Store Name */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: "50ms" }}>
        <Label htmlFor="storeName" className="flex items-center gap-2 text-foreground">
          <Store className="h-4 w-4 text-primary" />
          Nome da Loja
        </Label>
        <Input
          id="storeName"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="Ex: Magazine Luiza"
          className="h-12 bg-input border-border focus:border-primary"
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="space-y-2">
          <Label htmlFor="originalPrice" className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-destructive" />
            Preço Original (R$)
          </Label>
          <Input
            id="originalPrice"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(formatPrice(e.target.value))}
            placeholder="1.299,00"
            required
            className="h-12 bg-input border-border focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountPrice" className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-success" />
            Preço com Desconto (R$)
          </Label>
          <Input
            id="discountPrice"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(formatPrice(e.target.value))}
            placeholder="999,00"
            required
            className="h-12 bg-input border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Coupon */}
      <div className="space-y-4 animate-fade-up" style={{ animationDelay: "150ms" }}>
        <Label className="flex items-center gap-2 text-foreground">
          <Tag className="h-4 w-4 text-primary" />
          Possui Cupom de Desconto?
        </Label>
        <RadioGroup
          value={hasCoupon ? "yes" : "no"}
          onValueChange={(value) => setHasCoupon(value === "yes")}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="coupon-yes" />
            <Label htmlFor="coupon-yes" className="cursor-pointer">Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="coupon-no" />
            <Label htmlFor="coupon-no" className="cursor-pointer">Não</Label>
          </div>
        </RadioGroup>

        {hasCoupon && (
          <div className="space-y-2 animate-scale-in">
            <Label htmlFor="couponName" className="text-muted-foreground">
              Nome do Cupom
            </Label>
            <Input
              id="couponName"
              value={couponName}
              onChange={(e) => setCouponName(e.target.value.toUpperCase())}
              placeholder="Ex: DESCONTO20"
              className="h-12 bg-input border-border focus:border-primary uppercase"
            />
          </div>
        )}
      </div>

      {/* Product Link */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <Label htmlFor="productLink" className="flex items-center gap-2 text-foreground">
          <Link2 className="h-4 w-4 text-primary" />
          Link do Produto
        </Label>
        <div className="relative">
          <Input
            id="productLink"
            value={productLink}
            onChange={(e) => setProductLink(e.target.value)}
            placeholder="https://www.loja.com.br/produto"
            required
            className="h-12 bg-input border-border focus:border-primary pr-10"
          />
          {isLoadingImage && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        {isLoadingImage && (
          <p className="text-sm text-muted-foreground animate-pulse-soft">
            Buscando imagem do produto... (5 segundos)
          </p>
        )}
      </div>

      {/* Scheduled Time */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: "250ms" }}>
        <Label className="flex items-center gap-2 text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          Horário Programado para Envio (opcional)
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-12 justify-start text-left font-normal",
                  !scheduledDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduledDate ? format(scheduledDate, "PPP", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                initialFocus
                className="pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="h-12 bg-input border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        variant="gradient" 
        size="xl" 
        className="w-full animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        Gerar Mensagem
      </Button>
    </form>
  );
}
