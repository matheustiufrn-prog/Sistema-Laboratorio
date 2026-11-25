import type { LabPanel, LabParam, RefRange } from './labCatalog'

// ---------------------------------------------------------------------------
// ATENÇÃO: as faixas abaixo são valores comuns para ADULTOS, usados como ponto
// de partida. Em coagulação e em hormônios os valores de referência dependem do
// reagente, do equipamento e da plataforma de cada laboratório (por exemplo, TP,
// TTPa, TSH, cortisol e hormônios sexuais). Confira com a bula do seu método e
// com o responsável técnico antes de usar com pacientes. Cada referência pode
// ser editada no próprio laudo.
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

const PHASES_FSH =
  'Folicular: 3,5 a 12,5 | Ovulatório: 4,7 a 21,5 | Lúteo: 1,7 a 7,7 | Pós-menopausa: 25,8 a 134,8'
const PHASES_LH =
  'Folicular: 2,4 a 12,6 | Ovulatório: 14,0 a 95,6 | Lúteo: 1,0 a 11,4 | Pós-menopausa: 7,7 a 58,5'
const PHASES_E2 =
  'Folicular: 12,5 a 166 | Ovulatório: 85,8 a 498 | Lúteo: 43,8 a 211 | Pós-menopausa: inferior a 54,7'
const PHASES_P4 =
  'Folicular: 0,2 a 1,5 | Lúteo: 1,7 a 27,0 | Pós-menopausa: inferior a 0,7'

export const EXTRA_PANELS: LabPanel[] = [
  {
    id: 'COAGULACAO',
    name: 'Coagulograma',
    short: 'Coagulação',
    material: 'Plasma citratado (citrato de sódio 3,2%)',
    method: 'Coagulométrico e cromogênico em analisador automatizado de coagulação',
    groups: [
      {
        name: 'Provas de coagulação',
        params: [
          num('tp', 'Tempo de protrombina (TP)', 's', all('10,0 a 14,0')),
          num('tp_ctrl', 'TP - controle normal', 's', all('-')),
          num('atp', 'Atividade de protrombina', '%', all('70 a 120')),
          num('inr', 'INR', '', all('0,80 a 1,20 (sem anticoagulante oral)')),
          num('ttpa', 'TTPa (tempo de tromboplastina parcial ativada)', 's', all('25,0 a 36,0')),
          num('ttpa_ctrl', 'TTPa - controle normal', 's', all('-')),
          num('ttpa_rel', 'Relação TTPa (paciente/controle)', '', all('0,80 a 1,20')),
          num('tt', 'Tempo de trombina (TT)', 's', all('14,0 a 21,0')),
          num('fibrinogenio', 'Fibrinogênio', 'mg/dL', all('200 a 400')),
        ],
      },
      {
        name: 'Hemostasia primária e tempos',
        params: [
          num('ts', 'Tempo de sangramento (Duke)', 'min', all('Até 3,0')),
          num('tc', 'Tempo de coagulação (Lee-White)', 'min', all('5,0 a 10,0')),
          txt('retracao', 'Retração do coágulo', 'Normal', ['Normal', 'Reduzida', 'Ausente'], ['Normal']),
          txt('laco', 'Prova do laço', 'Negativa', ['Negativa', 'Positiva'], ['Negativa']),
        ],
      },
      {
        name: 'Fibrinólise',
        params: [num('ddimero', 'D-dímero', 'ng/mL FEU', all('Inferior a 500'))],
      },
      {
        name: 'Inibidores e fatores (quando solicitados)',
        params: [
          num('at3', 'Antitrombina III (atividade)', '%', all('80 a 120')),
          num('pc', 'Proteína C (atividade)', '%', all('70 a 140')),
          num('ps', 'Proteína S livre', '%', all('60 a 140')),
          num('f8', 'Fator VIII (atividade)', '%', all('50 a 150')),
          num('f9', 'Fator IX (atividade)', '%', all('50 a 150')),
          txt('lupico', 'Anticoagulante lúpico (triagem)', 'Negativo', ['Negativo', 'Positivo'], ['Negativo']),
        ],
      },
    ],
  },
  {
    id: 'HORMONAL',
    name: 'Perfil hormonal',
    short: 'Hormonal',
    material: 'Soro',
    method: 'Imunoensaio por quimioluminescência (confira a plataforma utilizada pelo laboratório)',
    groups: [
      {
        name: 'Tireoide',
        params: [
          num('tsh', 'TSH', 'µUI/mL', all('0,40 a 4,50')),
          num('t4l', 'T4 livre', 'ng/dL', all('0,70 a 1,80')),
          num('t4', 'T4 total', 'µg/dL', all('5,1 a 14,1')),
          num('t3', 'T3 total', 'ng/dL', all('80 a 200')),
          num('t3l', 'T3 livre', 'pg/mL', all('2,3 a 4,2')),
          num('atpo', 'Anti-TPO (anticorpos antiperoxidase)', 'UI/mL', all('Inferior a 35')),
          num('atg', 'Anti-tireoglobulina', 'UI/mL', all('Inferior a 40')),
          num('tg', 'Tireoglobulina', 'ng/mL', all('3,5 a 77,0')),
        ],
      },
      {
        name: 'Hormônios sexuais e gonadotrofinas',
        params: [
          num('fsh', 'FSH', 'mUI/mL', sexual('1,5 a 12,4', PHASES_FSH)),
          num('lh', 'LH', 'mUI/mL', sexual('1,7 a 8,6', PHASES_LH)),
          num('e2', 'Estradiol', 'pg/mL', sexual('Até 40', PHASES_E2)),
          num('p4', 'Progesterona', 'ng/mL', sexual('Até 1,4', PHASES_P4)),
          num('testo', 'Testosterona total', 'ng/dL', sexual('249 a 836', '8 a 48')),
          num('shbg', 'SHBG', 'nmol/L', sexual('18 a 54', '32 a 128')),
          num('dheas', 'DHEA-S (sulfato de dehidroepiandrosterona)', 'µg/dL', all('Conforme faixa etária e sexo (ver bula do método)')),
          num('prl', 'Prolactina', 'ng/mL', sexual('4,0 a 15,2', '4,8 a 23,3')),
          num('bhcg', 'Beta-HCG', 'mUI/mL', all('Inferior a 5,0 (não gestante)')),
        ],
      },
      {
        name: 'Suprarrenal e hipófise',
        params: [
          num('cortisol', 'Cortisol (coleta pela manhã)', 'µg/dL', all('6,2 a 19,4')),
          num('acth', 'ACTH', 'pg/mL', all('7,2 a 63,3')),
          num('gh', 'GH (hormônio do crescimento)', 'ng/mL', all('Até 5,0')),
          num('igf1', 'IGF-1 (somatomedina C)', 'ng/mL', all('Conforme faixa etária e sexo (ver bula do método)')),
        ],
      },
      {
        name: 'Metabolismo e cálcio',
        params: [
          num('insulina', 'Insulina basal', 'µUI/mL', all('2,6 a 24,9')),
          num('homa', 'HOMA-IR', '', all('Inferior a 2,7')),
          num('pth', 'Paratormônio (PTH)', 'pg/mL', all('15 a 65')),
          num('vitd', '25-hidroxivitamina D', 'ng/mL', all('Acima de 20 (população geral); 30 a 60 (grupos de risco)')),
        ],
      },
    ],
  },
]
