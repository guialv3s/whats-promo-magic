import { useState, useEffect, useRef } from "react";
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
  Loader2,
  ImagePlus,
  X,
  Upload
} from "lucide-react";
import { ProductData } from "@/types/product";
import { toast } from "sonner";

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPrice = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleImageUpload = (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProductImage(result);
      toast.success('Imagem carregada com sucesso!');
    };
    reader.onerror = () => {
      toast.error('Erro ao carregar a imagem');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setProductImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        <Input
          id="productLink"
          value={productLink}
          onChange={(e) => setProductLink(e.target.value)}
          placeholder="https://www.loja.com.br/produto"
          required
          className="h-12 bg-input border-border focus:border-primary"
        />
      </div>

      {/* Product Image Upload */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: "225ms" }}>
        <Label className="flex items-center gap-2 text-foreground">
          <ImagePlus className="h-4 w-4 text-primary" />
          Imagem do Produto (opcional)
        </Label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="product-image-input"
        />

        {productImage ? (
          // Image Preview
          <div className="relative group">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border bg-secondary/30">
              <img
                src={productImage}
                alt="Preview do produto"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Trocar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Passe o mouse sobre a imagem para trocar ou remover
            </p>
          </div>
        ) : (
          // Upload Area
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200",
              "flex flex-col items-center justify-center gap-2",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
            )}
          >
            <ImagePlus className={cn(
              "h-8 w-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="text-center">
              <p className={cn(
                "text-sm font-medium",
                isDragging ? "text-primary" : "text-foreground"
              )}>
                {isDragging ? "Solte a imagem aqui" : "Clique ou arraste uma imagem"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou GIF (máx. 5MB)
              </p>
            </div>
          </div>
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
