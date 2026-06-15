/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  CreditCard, 
  Search, 
  Plus, 
  LogOut, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  UserPlus,
  Phone,
  MessageCircle,
  Calendar,
  Filter,
  X,
  Pencil
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { Membro, Mensalidade, MembroComMensalidade } from './types';

// Login component
const Login = ({ onLogin }: { onLogin: (remember: boolean) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin@tropeiros') {
      onLogin(remember);
    } else {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-brown/10 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-brand-brown/10"
      >
        <div className="bg-black p-8 text-center text-white">
          <h1 className="font-serif text-3xl font-bold mb-2 text-white">Piquete Tropeiros da Lealdade</h1>
          <p className="text-brand-tan/80 text-sm">Gerenciamento de Mensalidades</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!isConfigured && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1"><ShieldAlert size={14} /> Atenção:</span>
              <span>Chaves do Supabase não detectadas nos Secrets. Configure <b>VITE_SUPABASE_URL</b> e <b>VITE_SUPABASE_ANON_KEY</b>.</span>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 block">Usuário</label>
            <input 
              id="login-username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-brown/20 transition-all"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 block">Senha</label>
            <input 
              id="login-password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-brown/20 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div className="flex items-center gap-2 py-1">
            <input 
              id="remember-me"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 text-black border-stone-300 rounded focus:ring-0 cursor-pointer accent-black"
            />
            <label htmlFor="remember-me" className="text-sm text-stone-600 cursor-pointer select-none">
              Salvar login (Permanecer conectado)
            </label>
          </div>
          
          <button 
            id="login-submit"
            type="submit"
            className="w-full bg-black hover:bg-stone-800 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg active:scale-[0.98]"
          >
            Acessar Sistema
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden relative"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-stone-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('tropeiros_admin_auth') === 'true';
  });
  const [members, setMembers] = useState<MembroComMensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'atrasados' | 'em_dia'>('all');

  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleLoginSuccess = (remember: boolean) => {
    if (remember) {
      localStorage.setItem('tropeiros_admin_auth', 'true');
    }
    setIsAdmin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tropeiros_admin_auth');
    setIsAdmin(false);
  };

  const [selectedMember, setSelectedMember] = useState<MembroComMensalidade | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMember, setEditMember] = useState({
    id: 0,
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
  });

  // Form state for new member
  const [newMember, setNewMember] = useState({
    nome: '',
    sobrenome: '',
    cpf: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    vencimentoInicial: new Date().toISOString().split('T')[0],
    valorMensalidade: '50.00'
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!isConfigured) {
      setError('Configuração Necessária: Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nos Secrets do projeto.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Usando os nomes EXATOS das tabelas conforme o Schema (Case Sensitive)
      const { data: membersData, error: membersError } = await supabase
        .from('Membros')
        .select('*')
        .order('nome', { ascending: true });

      if (membersError) {
        console.error('Erro Membros:', membersError);
        throw membersError;
      }

      const { data: tuitionData, error: tuitionError } = await supabase
        .from('Mensalidade')
        .select('*')
        .order('dataVencimento', { ascending: false });

      if (tuitionError) {
        console.error('Erro Mensalidades:', tuitionError);
        throw tuitionError;
      }

      const processedMembers = (membersData as Membro[]).map(member => {
        // Garantindo que a comparação de CPF seja entre números
        const memberTuition = (tuitionData as Mensalidade[]).filter(t => 
          Number(t.id_membro) === Number(member.cpf)
        );
        
        const today = new Date();
        const hasAtraso = memberTuition.some(t => {
          const dueDate = new Date(t.dataVencimento);
          // Considera atrasado se não está pago e o vencimento já passou
          return !t.statuspg && dueDate < today;
        });

        return {
          ...member,
          mensalidades: memberTuition,
          statusPagamento: hasAtraso ? 'atrasado' : (memberTuition.length > 0 ? 'em_dia' : 'pendente')
        };
      });

      setMembers(processedMembers);
      
      // Update selected member if it was open
      if (selectedMember) {
        const updatedSelected = processedMembers.find(m => m.id === selectedMember.id);
        if (updatedSelected) setSelectedMember(updatedSelected);
      }
    } catch (err) {
      console.error('Erro completo:', err);
      setError('Falha ao carregar dados. Verifique se as tabelas "Membros" e "Mensalidade" existem e se as chaves do Supabase estão corretas.');
    } finally {
      setLoading(false);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleTuitionStatus = async (tuitionId: number, currentStatus: boolean, currentDueDate: string) => {
    try {
      setIsProcessing(true);
      const newStatus = !currentStatus;
      const updateData: any = { statuspg: newStatus };
      
      if (newStatus) {
        const date = new Date(currentDueDate);
        date.setDate(date.getDate() + 30);
        updateData.dataVencimento = date.toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('Mensalidade')
        .update(updateData)
        .eq('id', tuitionId);

      if (error) throw error;

      await fetchData();
      alert(newStatus ? 'Mensalidade quitada e vencimento prorrogado!' : 'Status alterado para pendente.');
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      alert('Erro ao atualizar status: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAllAsPaid = async (member: MembroComMensalidade) => {
    try {
      setIsProcessing(true);
      const unpaid = member.mensalidades.filter(m => !m.statuspg);
      if (unpaid.length === 0) {
        alert('Todas as mensalidades já estão quitadas.');
        return;
      }

      console.log(`Quitando ${unpaid.length} mensalidades...`);

      const updatePromises = unpaid.map(async t => {
        const date = new Date(t.dataVencimento);
        date.setDate(date.getDate() + 30);
        const { error } = await supabase
          .from('Mensalidade')
          .update({ 
            statuspg: true, 
            dataVencimento: date.toISOString().split('T')[0] 
          })
          .eq('id', t.id);
        
        if (error) throw error;
        return t.id;
      });

      await Promise.all(updatePromises);

      await fetchData();
      alert('A mensalidade do membro foi atualizada para paga no banco e o próximo vencimento será em 30 dias.');
    } catch (err) {
      console.error('Erro geral ao quitar:', err);
      alert('Erro ao atualizar mensalidades: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cpfNumber = Number(newMember.cpf.replace(/\D/g, ''));
      
      // 1. Inserir Membro na tabela "Membros"
      const { error: memberError } = await supabase
        .from('Membros')
        .insert([{
          nome: newMember.nome,
          sobrenome: newMember.sobrenome,
          cpf: cpfNumber,
          email: newMember.email,
          telefone: Number(newMember.telefone.replace(/\D/g, '')),
          dataNascimento: newMember.dataNascimento,
          status: true
        }]);

      if (memberError) throw memberError;

      // 2. Inserir primeira mensalidade na tabela "Mensalidade"
      const dueDate = new Date(newMember.vencimentoInicial);
      const { error: tuitionError } = await supabase
        .from('Mensalidade')
        .insert([{
          anoReferencia: dueDate.getFullYear(),
          mesReferencia: dueDate.getMonth() + 1,
          valorDevido: Number(newMember.valorMensalidade),
          dataVencimento: newMember.vencimentoInicial,
          statuspg: false,
          id_membro: cpfNumber
        }]);

      if (tuitionError) throw tuitionError;

      setIsAddModalOpen(false);
      setNewMember({
        nome: '',
        sobrenome: '',
        cpf: '',
        email: '',
        telefone: '',
        dataNascimento: '',
        vencimentoInicial: new Date().toISOString().split('T')[0],
        valorMensalidade: '50.00'
      });
      await fetchData();
    } catch (err) {
      alert('Erro ao cadastrar: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('Membros')
        .update({
          nome: editMember.nome,
          sobrenome: editMember.sobrenome,
          email: editMember.email,
          telefone: Number(editMember.telefone.replace(/\D/g, '')),
          dataNascimento: editMember.dataNascimento,
        })
        .eq('id', editMember.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Erro ao editar: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (member: MembroComMensalidade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditMember({
      id: member.id,
      nome: member.nome,
      sobrenome: member.sobrenome,
      email: member.email || '',
      telefone: String(member.telefone || ''),
      dataNascimento: member.dataNascimento || '',
    });
    setIsEditModalOpen(true);
  };

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = 
        `${member.nome} ${member.sobrenome}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(member.cpf).includes(searchTerm);
      
      const matchesFilter = 
        filterMode === 'all' || 
        (filterMode === 'atrasados' && member.statusPagamento === 'atrasado') ||
        (filterMode === 'em_dia' && member.statusPagamento === 'em_dia');

      return matchesSearch && matchesFilter;
    });
  }, [members, searchTerm, filterMode]);

  const stats = useMemo(() => {
    return {
      total: members.length,
      atrasados: members.filter(m => m.statusPagamento === 'atrasado').length,
      em_dia: members.filter(m => m.statusPagamento === 'em_dia').length
    };
  }, [members]);

  if (!isAdmin) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black text-white py-4 px-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-tan/20 p-2 rounded-lg">
              <Users className="text-brand-tan" size={24} />
            </div>
            <div>
              <h1 className="font-sans text-xl font-bold leading-tight">Piquete Tropeiros da Lealdade</h1>
              <p className="text-xs text-brand-tan/70 tracking-wider uppercase">Painel Administrativo</p>
            </div>
          </div>
          
          <button 
            id="logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle className="shrink-0" size={20} />
            <div className="flex-1 text-sm">
              <p className="font-bold">Problema na Conexão</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={fetchData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {!isConfigured && !error && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
            <ShieldAlert className="shrink-0" size={20} />
            <div className="flex-1 text-sm">
              <p className="font-bold">Configuração Necessária</p>
              <p>Adicione as chaves <b>VITE_SUPABASE_URL</b> e <b>VITE_SUPABASE_ANON_KEY</b> nos Secrets do projeto para visualizar os dados.</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4"
          >
            <div className="bg-stone-50 p-3 rounded-xl">
              <Users className="text-stone-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-tight">Total de Membros</p>
              <h3 className="text-2xl font-bold text-stone-800">{stats.total}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm flex items-center gap-4"
          >
            <div className="bg-orange-50 p-3 rounded-xl">
              <ShieldAlert className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-tight">Com Atraso</p>
              <h3 className="text-2xl font-bold text-orange-600">{stats.atrasados}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4"
          >
            <div className="bg-emerald-50 p-3 rounded-xl">
              <CheckCircle2 className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-tight">Em Dia</p>
              <h3 className="text-2xl font-bold text-emerald-600">{stats.em_dia}</h3>
            </div>
          </motion.div>
        </section>

        {/* Search and Filters */}
        <section className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input 
                id="member-search"
                type="text"
                placeholder="Buscar por nome ou CPF..."
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-brown/10 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              id="add-member-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-black hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <UserPlus size={20} />
              Novo Membro
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter size={16} className="text-stone-400 shrink-0" />
            <button 
              onClick={() => setFilterMode('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterMode === 'all' ? 'bg-[#1b5a9a] text-white' : 'bg-stone-100 text-stone-600'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterMode('atrasados')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterMode === 'atrasados' ? 'bg-orange-100 text-orange-700 font-bold border border-orange-200' : 'bg-stone-100 text-stone-600'}`}
            >
              Atrasados
            </button>
            <button 
              onClick={() => setFilterMode('em_dia')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterMode === 'em_dia' ? 'bg-emerald-100 text-emerald-700 font-bold border border-emerald-200' : 'bg-stone-100 text-stone-600'}`}
            >
              Em Dia
            </button>
          </div>
        </section>

        {/* Member List */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Membro</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider hidden md:table-cell">CPF</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Contato</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status Financeiro</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8 h-16 bg-stone-50/30" />
                    </tr>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500 italic">
                      Nenhum membro encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr 
                      key={member.id} 
                      className="hover:bg-stone-50/50 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedMember(member);
                        setIsFinanceModalOpen(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-brown/5 flex items-center justify-center text-brand-brown font-bold text-sm">
                            {member.nome[0]}{member.sobrenome[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-stone-800 group-hover:text-brand-brown transition-colors">
                              {member.nome} {member.sobrenome}
                            </div>
                            <div className="text-xs text-stone-400 capitalize">Membro desde {new Date(member.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm font-mono text-stone-600">{member.cpf}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-stone-600">
                            <Phone size={12} className="text-stone-400" />
                            {member.telefone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-600">
                            <MessageCircle size={12} className="text-stone-400" />
                            {member.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.statusPagamento === 'atrasado' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd4d4] text-orange-700 text-xs font-bold ring-1 ring-orange-200">
                            <AlertCircle size={14} />
                            Atrasado
                          </span>
                        ) : member.statusPagamento === 'em_dia' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold ring-1 ring-emerald-200">
                            <CheckCircle2 size={14} />
                            Em Dia
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-bold ring-1 ring-stone-200">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => openEditModal(member, e)}
                            className="bg-white border border-stone-200 hover:border-blue-400 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 text-stone-500"
                            title="Editar dados do membro"
                          >
                            <Pencil size={14} />
                            <span>Editar</span>
                          </button>
                          <button 
                            id={`send-bill-${member.id}`}
                            onClick={async (e) => {
                              const btn = e.currentTarget;
                              const originalInner = btn.innerHTML;
                              try {
                                btn.disabled = true;
                                btn.innerHTML = '<span className="animate-spin inline-block">⏳</span>';
                                
                                const webhookUrl = import.meta.env.VITE_WEBHOOK_URL || '';
                                if (!webhookUrl) throw new Error('VITE_WEBHOOK_URL não configurada');
                                const response = await fetch(`${webhookUrl}/webhook/enviar-cobranca`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    membro: {
                                      id: member.id,
                                      nome_completo: `${member.nome} ${member.sobrenome}`,
                                      cpf: member.cpf,
                                      email: member.email,
                                      telefone: member.telefone,
                                      status_pagamento: member.statusPagamento
                                    },
                                    data_envio: new Date().toISOString()
                                  })
                                });

                                if (!response.ok) throw new Error('Falha no webhook');
                                
                                btn.innerHTML = '✅ Enviado';
                                setTimeout(() => { btn.innerHTML = originalInner; btn.disabled = false; }, 2000);
                              } catch (err) {
                                console.error('Erro webhook:', err);
                                btn.innerHTML = '❌ Erro';
                                setTimeout(() => { btn.innerHTML = originalInner; btn.disabled = false; }, 2000);
                              }
                            }}
                            className="bg-white border border-stone-200 hover:border-brand-brown hover:text-brand-brown px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 text-[#259500]"
                            title="Enviar cobrança via Webhook"
                          >
                            <MessageCircle size={14} />
                            <span>Enviar Cobrança</span>
                          </button>
                          
                          <button className="text-stone-400 hover:text-brand-brown transition-colors p-1">
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Add Member Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Cadastrar Novo Membro"
      >
        <form onSubmit={handleAddMember} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Nome</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={newMember.nome}
                onChange={(e) => setNewMember({...newMember, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Sobrenome</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={newMember.sobrenome}
                onChange={(e) => setNewMember({...newMember, sobrenome: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">CPF (Apenas números)</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={newMember.cpf}
                onChange={(e) => setNewMember({...newMember, cpf: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Nascimento</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={newMember.dataNascimento}
                onChange={(e) => setNewMember({...newMember, dataNascimento: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Email</label>
              <input 
                type="email"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Telefone</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={newMember.telefone}
                onChange={(e) => setNewMember({...newMember, telefone: e.target.value})}
              />
            </div>
          </div>

          <div className="p-4 bg-brand-brown/5 rounded-2xl border border-brand-brown/10 space-y-4">
            <div className="flex items-center gap-2 text-brand-brown font-bold text-sm border-b border-brand-brown/10 pb-2">
              <CreditCard size={18} />
              Configuração da Primeira Mensalidade
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Data de Vencimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                    value={newMember.vencimentoInicial}
                    onChange={(e) => setNewMember({...newMember, vencimentoInicial: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Valor (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                  value={newMember.valorMensalidade}
                  onChange={(e) => setNewMember({...newMember, valorMensalidade: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 px-6 py-3 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 bg-brand-brown hover:bg-stone-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
              Confirmar Cadastro
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Dados do Membro"
      >
        <form onSubmit={handleEditMember} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Nome</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={editMember.nome}
                onChange={(e) => setEditMember({...editMember, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Sobrenome</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={editMember.sobrenome}
                onChange={(e) => setEditMember({...editMember, sobrenome: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={editMember.email}
                onChange={(e) => setEditMember({...editMember, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Telefone</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                value={editMember.telefone}
                onChange={(e) => setEditMember({...editMember, telefone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Data de Nascimento</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
              value={editMember.dataNascimento}
              onChange={(e) => setEditMember({...editMember, dataNascimento: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-6 py-3 border border-stone-200 rounded-xl font-bold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>

      <ManageFinanceModal
        isOpen={isFinanceModalOpen}
        onClose={() => {
          setIsFinanceModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        onToggleStatus={handleToggleTuitionStatus}
        onMarkAllPaid={() => selectedMember && handleMarkAllAsPaid(selectedMember)}
        isProcessing={isProcessing}
      />

      <footer className="py-8 px-6 text-center text-stone-400 text-xs tracking-widest uppercase">
        &copy; {new Date().getFullYear()} Piquete Tropeiros da Lealdade - Tradição e Honra
      </footer>
    </div>
  );
}

const ManageFinanceModal = ({ 
  isOpen, 
  onClose, 
  member, 
  onToggleStatus,
  onMarkAllPaid,
  isProcessing
}: { 
  isOpen: boolean; 
  onClose: () => void;
  member: MembroComMensalidade | null;
  onToggleStatus: (id: number, status: boolean, dueDate: string) => void;
  onMarkAllPaid: () => void;
  isProcessing: boolean;
}) => {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="bg-black p-6 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">{member.nome} {member.sobrenome}</h2>
            <p className="text-xs text-stone-400 font-mono tracking-widest uppercase">Gerenciamento Financeiro • CPF: {member.cpf}</p>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <div className={`p-2 rounded-lg ${member.statusPagamento === 'atrasado' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {member.statusPagamento === 'atrasado' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium uppercase">Status Geral</p>
                <p className="font-bold text-stone-900">{member.statusPagamento === 'atrasado' ? 'Atrasado' : 'Em Dia'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase">Próximo Vencimento</p>
                <p className="font-bold text-stone-900">
                  {member.mensalidades.length > 0 
                    ? new Date(Math.max(...member.mensalidades.map(m => new Date(m.dataVencimento).getTime()))).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={() => {
                if (confirm('Deseja marcar a mensalidade desse membro como Paga?')) {
                  onMarkAllPaid();
                }
              }}
              disabled={isProcessing}
              className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <CheckCircle2 size={16} />
              )}
              Quitar
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Histórico de Mensalidades</h3>
            <div className="grid gap-3">
              {member.mensalidades.length === 0 ? (
                <div className="text-center py-8 text-stone-400 italic bg-stone-50 rounded-xl border-2 border-dashed border-stone-100">
                  Nenhum registro de mensalidade encontrado.
                </div>
              ) : (
                member.mensalidades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 border border-stone-100 rounded-xl hover:border-stone-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 p-2 rounded-lg text-stone-500">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-stone-800">Mês {t.mesReferencia}/{t.anoReferencia}</p>
                        <p className="text-xs text-stone-400">Vencimento: {new Date(t.dataVencimento).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className="font-mono font-bold text-stone-600">R$ {t.valorDevido}</p>
                      <button
                        onClick={() => onToggleStatus(t.id, t.statuspg, t.dataVencimento)}
                        disabled={isProcessing}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                          t.statuspg 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {t.statuspg ? 'PAGO' : 'PENDENTE'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-100 transition-colors font-bold text-sm disabled:opacity-50"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
