import { EXTRA_PANELS } from './labCatalogExtra'

export type Sex = 'M' | 'F'
export type Flag = 'H' | 'L' | 'A' | null

export interface RefRange {
  text: string
  min?: number
  max?: number
}

export interface LabParam {
  key: string
  name: string
  unit: string
  ref: { ALL?: RefRange; M?: RefRange; F?: RefRange }
  options?: string[]
  normal?: string[]
  absOf?: string
}

export interface LabGroup {
  name: string
  params: LabParam[]
}

export interface LabPanel {
  id: 'HEMOGRAMA' | 'BIOQUIMICA' | 'URINA' | 'FEZES' | 'COAGULACAO' | 'HORMONAL'
  name: string
  short: string
  material: string
  method: string
  groups: LabGroup[]
}

// ---------------------------------------------------------------------------
// ATENÇÃO: os valores abaixo são faixas comuns para ADULTOS, usadas como ponto
// de partida. Confira com a bula do reagente/equipamento e com a validação do
// seu laboratório antes de usar. Cada referência pode ser editada no laudo.
// ---------------------------------------------------------------------------

const R = (text: string, min?: number, max?: number): RefRange => ({ text, min, max })
const all = (text: string, min?: number, max?: number) => ({ ALL: R(text, min, max) })
const sexual = (m: string, f: string) => ({ M: R(m), F: R(f) })

const num = (
  key: string,
  name: string,
  unit: string,
  ref: LabParam['ref'],
  extra: Partial<LabParam> = {}
): LabParam => ({ key, name, unit, ref, ...extra })

const txt = (
  key: string,
  name: string,
  refText: string,
  options: string[],
  normal: string[],
  unit = ''
): LabParam => ({ key, name, unit, ref: all(refText), options, normal })

const NEG = ['Negativo', 'Positivo (+)', 'Positivo (++)', 'Positivo (+++)']

const BASE_PANELS: LabPanel[] = [
  {
    id: 'HEMOGRAMA',
    name: 'Hemograma completo',
    short: 'Hemograma',
    material: 'Sangue total com EDTA',
    method: 'Automação hematológica (contagem e diferencial) com revisão de lâmina quando necessário',
    groups: [
      {
        name: 'Eritrograma',
        params: [
          num('hem', 'Hemácias', 'milhões/mm³', sexual('4,50 a 5,90', '4,00 a 5,20')),
          num('hb', 'Hemoglobina', 'g/dL', sexual('13,5 a 17,5', '12,0 a 16,0')),
          num('ht', 'Hematócrito', '%', sexual('41,0 a 53,0', '36,0 a 46,0')),
          num('vcm', 'VCM (volume corpuscular médio)', 'fL', all('80,0 a 100,0')),
          num('hcm', 'HCM (hemoglobina corpuscular média)', 'pg', all('27,0 a 32,0')),
          num('chcm', 'CHCM (concentração de Hb corpuscular média)', 'g/dL', all('32,0 a 36,0')),
          num('rdw', 'RDW', '%', all('11,5 a 14,5')),
        ],
      },
      {
        name: 'Leucograma (valores relativos)',
        params: [
          num('leuco', 'Leucócitos', '/mm³', all('4.000 a 10.000')),
          num('mielo', 'Mielócitos', '%', all('Ausentes', undefined, 0)),
          num('meta', 'Metamielócitos', '%', all('Ausentes', undefined, 0)),
          num('bast', 'Bastonetes', '%', all('0 a 5')),
          num('seg', 'Segmentados', '%', all('40 a 70')),
          num('eos', 'Eosinófilos', '%', all('1 a 5')),
          num('baso', 'Basófilos', '%', all('0 a 1')),
          num('linf', 'Linfócitos', '%', all('20 a 45')),
          num('mono', 'Monócitos', '%', all('2 a 10')),
        ],
      },
      {
        name: 'Leucograma (valores absolutos)',
        params: [
          num('bast_abs', 'Bastonetes', '/mm³', all('0 a 500'), { absOf: 'bast' }),
          num('seg_abs', 'Segmentados', '/mm³', all('1.800 a 7.000'), { absOf: 'seg' }),
          num('eos_abs', 'Eosinófilos', '/mm³', all('50 a 500'), { absOf: 'eos' }),
          num('baso_abs', 'Basófilos', '/mm³', all('0 a 100'), { absOf: 'baso' }),
          num('linf_abs', 'Linfócitos', '/mm³', all('1.000 a 4.000'), { absOf: 'linf' }),
          num('mono_abs', 'Monócitos', '/mm³', all('200 a 1.000'), { absOf: 'mono' }),
        ],
      },
      {
        name: 'Plaquetas',
        params: [num('plq', 'Plaquetas', '/mm³', all('150.000 a 450.000'))],
      },
    ],
  },
  {
    id: 'BIOQUIMICA',
    name: 'Bioquímica',
    short: 'Bioquímica',
    material: 'Soro',
    method: 'Automação bioquímica (colorimétrico / enzimático / eletrodo seletivo, conforme o analito)',
    groups: [
      {
        name: 'Glicemia',
        params: [
          num('glicose', 'Glicose em jejum', 'mg/dL', all('70 a 99')),
          num('hba1c', 'Hemoglobina glicada (HbA1c)', '%', all('Até 5,6 (normal); 5,7 a 6,4 (pré-diabetes); 6,5 ou mais (diabetes)')),
        ],
      },
      {
        name: 'Função renal',
        params: [
          num('ureia', 'Ureia', 'mg/dL', all('15 a 45')),
          num('creat', 'Creatinina', 'mg/dL', sexual('0,70 a 1,30', '0,60 a 1,10')),
          num('acurico', 'Ácido úrico', 'mg/dL', sexual('3,4 a 7,0', '2,4 a 5,7')),
        ],
      },
      {
        name: 'Perfil lipídico',
        params: [
          num('colt', 'Colesterol total', 'mg/dL', all('Inferior a 190 (desejável)')),
          num('hdl', 'HDL colesterol', 'mg/dL', all('Superior a 40')),
          num('ldl', 'LDL colesterol', 'mg/dL', all('Inferior a 130 (a meta varia conforme o risco cardiovascular)')),
          num('vldl', 'VLDL colesterol', 'mg/dL', all('Até 30')),
          num('tg', 'Triglicerídeos', 'mg/dL', all('Inferior a 150 (jejum)')),
        ],
      },
      {
        name: 'Função hepática',
        params: [
          num('tgo', 'TGO (AST)', 'U/L', all('Até 40')),
          num('tgp', 'TGP (ALT)', 'U/L', all('Até 41')),
          num('ggt', 'Gama-GT', 'U/L', sexual('10 a 71', '6 a 42')),
          num('fa', 'Fosfatase alcalina', 'U/L', all('40 a 129')),
          num('bt', 'Bilirrubina total', 'mg/dL', all('0,2 a 1,2')),
          num('bd', 'Bilirrubina direta', 'mg/dL', all('Até 0,3')),
          num('bi', 'Bilirrubina indireta', 'mg/dL', all('0,2 a 0,8')),
        ],
      },
      {
        name: 'Proteínas',
        params: [
          num('prot', 'Proteínas totais', 'g/dL', all('6,4 a 8,3')),
          num('alb', 'Albumina', 'g/dL', all('3,5 a 5,2')),
          num('glob', 'Globulinas', 'g/dL', all('2,0 a 3,5')),
        ],
      },
      {
        name: 'Eletrólitos e minerais',
        params: [
          num('na', 'Sódio', 'mmol/L', all('136 a 145')),
          num('k', 'Potássio', 'mmol/L', all('3,5 a 5,1')),
          num('cl', 'Cloreto', 'mmol/L', all('98 a 107')),
          num('ca', 'Cálcio total', 'mg/dL', all('8,6 a 10,2')),
          num('mg', 'Magnésio', 'mg/dL', all('1,6 a 2,6')),
          num('p', 'Fósforo', 'mg/dL', all('2,5 a 4,5')),
        ],
      },
      {
        name: 'Outros',
        params: [
          num('ferro', 'Ferro sérico', 'µg/dL', sexual('65 a 175', '50 a 170')),
          num('ferritina', 'Ferritina', 'ng/mL', sexual('30 a 400', '15 a 150')),
          num('amilase', 'Amilase', 'U/L', all('28 a 100')),
        ],
      },
    ],
  },
  {
    id: 'URINA',
    name: 'Urina tipo I (EAS)',
    short: 'Urina (EAS)',
    material: 'Urina (amostra isolada, jato médio)',
    method: 'Tira reagente (química) e microscopia óptica (sedimentoscopia)',
    groups: [
      {
        name: 'Exame físico',
        params: [
          txt('volume', 'Volume', '-', [], [], 'mL'),
          txt('cor', 'Cor', 'Amarelo-citrino', ['Amarelo-citrino', 'Amarelo-claro', 'Amarelo', 'Amarelo-escuro', 'Âmbar', 'Avermelhada'], ['Amarelo-citrino', 'Amarelo-claro', 'Amarelo']),
          txt('aspecto', 'Aspecto', 'Límpido', ['Límpido', 'Ligeiramente turvo', 'Turvo'], ['Límpido']),
          txt('odor', 'Odor', 'Sui generis', ['Sui generis'], ['Sui generis']),
          num('dens', 'Densidade', '', all('1,005 a 1,030')),
          num('ph', 'pH', '', all('5,0 a 7,5')),
        ],
      },
      {
        name: 'Exame químico',
        params: [
          txt('prot_u', 'Proteínas', 'Negativo', NEG, ['Negativo']),
          txt('glic_u', 'Glicose', 'Negativo', NEG, ['Negativo']),
          txt('ceto', 'Corpos cetônicos', 'Negativo', NEG, ['Negativo']),
          txt('bili_u', 'Bilirrubina', 'Negativo', NEG, ['Negativo']),
          txt('uro', 'Urobilinogênio', 'Normal (até 1,0 mg/dL)', ['Normal', 'Aumentado'], ['Normal']),
          txt('nitrito', 'Nitrito', 'Negativo', ['Negativo', 'Positivo'], ['Negativo']),
          txt('sangue_u', 'Sangue (hemoglobina)', 'Negativo', NEG, ['Negativo']),
          txt('leuco_e', 'Leucócitos (esterase)', 'Negativo', NEG, ['Negativo']),
        ],
      },
      {
        name: 'Sedimentoscopia',
        params: [
          txt('epit', 'Células epiteliais', 'Raras', ['Raras', 'Escassas', 'Algumas', 'Numerosas'], ['Raras', 'Escassas', 'Ausentes']),
          num('leuco_s', 'Leucócitos', '/campo', all('Até 5 por campo')),
          num('hem_s', 'Hemácias', '/campo', all('Até 3 por campo')),
          txt('cilindros', 'Cilindros', 'Ausentes', ['Ausentes', 'Hialinos raros', 'Granulosos', 'Leucocitários', 'Hemáticos'], ['Ausentes']),
          txt('cristais', 'Cristais', 'Ausentes', ['Ausentes', 'Oxalato de cálcio', 'Ácido úrico', 'Fosfato amorfo', 'Urato amorfo'], ['Ausentes']),
          txt('muco', 'Muco', 'Ausente', ['Ausente', 'Escasso', 'Moderado', 'Abundante'], ['Ausente', 'Escasso']),
          txt('bacterias', 'Bactérias', 'Ausentes', ['Ausentes', 'Raras', 'Moderadas', 'Numerosas'], ['Ausentes', 'Raras']),
          txt('leveduras', 'Leveduras', 'Ausentes', ['Ausentes', 'Raras', 'Presentes'], ['Ausentes']),
          txt('outros_u', 'Outros elementos', '-', [], []),
        ],
      },
    ],
  },
  {
    id: 'FEZES',
    name: 'Parasitológico de fezes (EPF)',
    short: 'Fezes (EPF)',
    material: 'Fezes',
    method: 'Sedimentação espontânea (Hoffman, Pons e Janer)',
    groups: [
      {
        name: 'Exame macroscópico',
        params: [
          txt('consist', 'Consistência', 'Formada', ['Formada', 'Pastosa', 'Semipastosa', 'Diarreica', 'Líquida'], ['Formada']),
          txt('cor_f', 'Cor', 'Marrom', ['Marrom', 'Amarelada', 'Esverdeada', 'Escura', 'Esbranquiçada'], ['Marrom']),
          txt('muco_f', 'Muco', 'Ausente', ['Ausente', 'Presente'], ['Ausente']),
          txt('sangue_f', 'Sangue visível', 'Ausente', ['Ausente', 'Presente'], ['Ausente']),
          txt('restos', 'Restos alimentares', 'Ausentes', ['Ausentes', 'Presentes'], ['Ausentes']),
        ],
      },
      {
        name: 'Exame microscópico (parasitológico)',
        params: [
          txt('protoz', 'Protozoários', 'Ausência de parasitas', ['Não foram encontrados cistos ou trofozoítos de protozoários.'], ['Não foram encontrados cistos ou trofozoítos de protozoários.']),
          txt('helm', 'Helmintos', 'Ausência de parasitas', ['Não foram encontrados ovos ou larvas de helmintos.'], ['Não foram encontrados ovos ou larvas de helmintos.']),
        ],
      },
      {
        name: 'Pesquisas complementares',
        params: [
          txt('leuc_f', 'Leucócitos fecais', 'Ausentes', ['Ausentes', 'Raros', 'Presentes'], ['Ausentes', 'Raros']),
          txt('oculto', 'Pesquisa de sangue oculto', 'Negativa', ['Negativa', 'Positiva'], ['Negativa']),
        ],
      },
    ],
  },
]

export const PANELS: LabPanel[] = [...BASE_PANELS, ...EXTRA_PANELS]

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

// Aceita vírgula decimal. O ponto só é separador de milhar quando thousands = true
export function parseNum(raw: string, thousands = false): number | null {
  let s = String(raw ?? '').trim()
  if (!s) return null
  if (thousands && /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '')
  s = s.replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const NUMBER = '([\\d.,]+)'

// Extrai limites numéricos de um texto de referência ("13,5 a 17,5", "Até 40", "Superior a 40")
export function boundsFromText(text: string, thousands = false): { min: number | null; max: number | null } {
  const s = String(text ?? '').trim()
  const n = (v: string) => parseNum(v.replace(/[.,]+$/, ''), thousands)

  let m = s.match(new RegExp(`^(?:de\\s+)?${NUMBER}\\s*(?:a|–|-)\\s*${NUMBER}`, 'i'))
  if (m) return { min: n(m[1]), max: n(m[2]) }

  m = s.match(new RegExp(`^(?:até|ate|inferior a|menor que|<)\\s*${NUMBER}`, 'i'))
  if (m) return { min: null, max: n(m[1]) }

  m = s.match(new RegExp(`^(?:superior a|acima de|maior que|>)\\s*${NUMBER}`, 'i'))
  if (m) return { min: n(m[1]), max: null }

  return { min: null, max: null }
}

export function resolveRef(
  param: LabParam,
  sex: Sex | null
): { text: string; min: number | null; max: number | null } {
  const thousands = param.unit.startsWith('/mm')
  const pick = sex ? param.ref[sex] ?? param.ref.ALL : param.ref.ALL

  if (pick) {
    const derived = boundsFromText(pick.text, thousands)
    return { text: pick.text, min: pick.min ?? derived.min, max: pick.max ?? derived.max }
  }

  if (param.ref.M && param.ref.F) {
    return {
      text: `Homens: ${param.ref.M.text} / Mulheres: ${param.ref.F.text}`,
      min: null,
      max: null,
    }
  }

  const only = param.ref.M ?? param.ref.F
  if (only) {
    const d = boundsFromText(only.text, thousands)
    return { text: only.text, min: only.min ?? d.min, max: only.max ?? d.max }
  }

  return { text: '-', min: null, max: null }
}

export function computeFlag(a: {
  value: string
  min?: number | null
  max?: number | null
  thousands?: boolean
  normal?: string[]
}): Flag {
  const value = String(a.value ?? '').trim()
  if (!value) return null

  if (a.normal && a.normal.length > 0) {
    return a.normal.map(norm).includes(norm(value)) ? null : 'A'
  }

  const n = parseNum(value, a.thousands)
  if (n === null) return null
  if (a.min !== null && a.min !== undefined && n < a.min) return 'L'
  if (a.max !== null && a.max !== undefined && n > a.max) return 'H'
  return null
}
