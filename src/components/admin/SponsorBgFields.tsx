import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  BG_PRESETS,
  sponsorCardBackground,
  type SponsorBgType,
  type SponsorCardStyle,
} from '@/lib/sponsor-style'

type Props = {
  value: SponsorCardStyle
  onChange: (value: SponsorCardStyle) => void
}

export function SponsorBgFields({ value, onChange }: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-white/10 p-3">
      <Label>Fundo do card</Label>
      <div className="flex flex-wrap gap-2">
        {BG_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() =>
              onChange({
                bg_type: preset.bg_type,
                bg_color: preset.bg_color,
                bg_color_end: preset.bg_color_end,
              })
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Estilo</Label>
          <Select
            value={value.bg_type}
            onValueChange={(bg_type) => onChange({ ...value, bg_type: bg_type as SponsorBgType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Cor sólida</SelectItem>
              <SelectItem value="gradient">Degradê</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sp-bg1">{value.bg_type === 'gradient' ? 'Cor inicial' : 'Cor'}</Label>
          <Input
            id="sp-bg1"
            type="color"
            value={value.bg_color}
            onChange={(e) => onChange({ ...value, bg_color: e.target.value })}
            className="h-10 cursor-pointer p-1"
          />
        </div>
        {value.bg_type === 'gradient' ? (
          <div className="space-y-2 col-span-2">
            <Label htmlFor="sp-bg2">Cor final</Label>
            <Input
              id="sp-bg2"
              type="color"
              value={value.bg_color_end}
              onChange={(e) => onChange({ ...value, bg_color_end: e.target.value })}
              className="h-10 cursor-pointer p-1 max-w-[160px]"
            />
          </div>
        ) : null}
      </div>
      <div
        className="h-12 rounded-md border border-white/10"
        style={{ background: sponsorCardBackground(value) }}
      />
    </div>
  )
}
