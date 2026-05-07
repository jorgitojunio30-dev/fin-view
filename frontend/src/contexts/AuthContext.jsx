import { createContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregando(false);
    });
    return cancelar;
  }, []);

  async function cadastrar(nome, email, senha) {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(credencial.user, { displayName: nome });
    await setDoc(doc(db, 'users', credencial.user.uid), {
      name: nome,
      email: email,
      createdAt: serverTimestamp()
    });
    return credencial.user;
  }

  async function entrar(email, senha) {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    return credencial.user;
  }

  async function sair() {
    await signOut(auth);
  }

  async function recuperarSenha(email) {
    await sendPasswordResetEmail(auth, email);
  }

  async function atualizarPerfilUsuario(nome) {
    if (!usuario) return;
    await updateProfile(usuario, { displayName: nome });
    await updateDoc(doc(db, 'users', usuario.uid), {
      name: nome
    });
    // Forçar atualização do objeto usuario no estado
    setUsuario({ ...usuario, displayName: nome });
  }

  async function excluirConta() {
    if (!usuario) return;
    // Em um app real, você pode querer chamar uma cloud function para deletar todos os dados do Firestore antes
    await deleteUser(usuario);
  }

  const valor = {
    usuario,
    carregando,
    cadastrar,
    entrar,
    sair,
    recuperarSenha,
    atualizarPerfilUsuario,
    excluirConta
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}
