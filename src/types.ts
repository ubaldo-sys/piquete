export interface Membro {
  id: number;
  created_at: string;
  cpf: number;
  nome: string;
  sobrenome: string;
  dataNascimento: string;
  email: string;
  telefone: number;
  status: boolean;
}

export interface Mensalidade {
  id: number;
  created_at: string;
  anoReferencia: number;
  mesReferencia: number;
  valorDevido: number;
  dataVencimento: string;
  statuspg: boolean;
  id_membro: number;
}

export interface MembroComMensalidade extends Membro {
  mensalidades?: Mensalidade[];
  statusPagamento?: 'em_dia' | 'atrasado' | 'pendente';
}
