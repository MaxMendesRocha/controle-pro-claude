<#
  setup-pontopro.ps1

  Gera toda a estrutura de pastas e arquivos base do projeto PontoPro
  (Next.js + Firebase) dentro da pasta ATUAL.

  COMO USAR:
  1. Rode `npx create-next-app@latest .` numa pasta vazia e nova
     (com TypeScript, Tailwind, ESLint, App Router, src/, import alias "@/*")
  2. Copie este arquivo para a RAIZ desse projeto Next (mesmo nivel do package.json)
  3. Abra o PowerShell nessa pasta e rode:
       powershell -ExecutionPolicy Bypass -File .\setup-pontopro.ps1
  4. Ao final, preencha o .env.local com suas chaves do Firebase

  O script e' seguro para rodar mais de uma vez: ele NUNCA sobrescreve
  um arquivo que ja existe (usa -Force so' em New-Item de pastas).
#>

$ErrorActionPreference = "Stop"

function New-Dir($path) {
    New-Item -ItemType Directory -Force -Path $path | Out-Null
}

function New-FileIfMissing($path, [string]$content) {
    if (Test-Path -LiteralPath $path) {
        Write-Host "  (ja existe, pulei) $path" -ForegroundColor DarkYellow
        return
    }
    $dir = Split-Path -Parent $path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Dir $dir
    }
    # Caminho absoluto sem depender do arquivo ja existir (Resolve-Path exige existencia, entao nao usamos)
    $fullPath = Join-Path -Path (Get-Location).Path -ChildPath $path

    # UTF8 sem BOM, para evitar problemas de parsing no Node/TS
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($fullPath, $content, $utf8NoBom)
    Write-Host "  criado: $path" -ForegroundColor Green
}

Write-Host "==> Verificando se estamos na raiz de um projeto Next.js..." -ForegroundColor Cyan
if (-not (Test-Path -LiteralPath ".\package.json")) {
    Write-Host "ERRO: package.json nao encontrado na pasta atual." -ForegroundColor Red
    Write-Host "Rode este script de dentro da raiz do projeto Next (onde esta o package.json)." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path -LiteralPath ".\src")) {
    Write-Host "AVISO: pasta 'src' nao encontrada. Confirme que o create-next-app usou --src-dir." -ForegroundColor Yellow
}

Write-Host "==> Criando estrutura de pastas..." -ForegroundColor Cyan

$dirs = @(
    "src\app\(auth)\login",
    "src\app\(gestor)\dashboard",
    "src\app\(gestor)\colaboradores",
    "src\app\(gestor)\registros",
    "src\app\(gestor)\holerites",
    "src\app\(gestor)\regras",
    "src\app\(colaborador)\meu-ponto",
    "src\app\(colaborador)\meus-registros",
    "src\app\(colaborador)\meu-holerite",
    "src\app\api\ponto",
    "src\app\api\holerite",
    "src\app\api\colaboradores",
    "src\components\ui",
    "src\components\ponto",
    "src\components\colaboradores",
    "src\components\holerite",
    "src\lib\firebase",
    "src\lib\calculos",
    "src\lib\auth",
    "src\types",
    "scripts"
)

foreach ($d in $dirs) {
    New-Dir $d
}
Write-Host "  pastas criadas." -ForegroundColor Green

Write-Host "==> Criando arquivos base (nao sobrescreve o que ja existe)..." -ForegroundColor Cyan

# ---------- src/types/index.ts ----------
$typesContent = @'
export type Role = 'gestor' | 'colaborador';

export interface Colaborador {
  id: string;
  empresaId: string;
  uid: string; // Firebase Auth UID
  nome: string;
  cpf: string;
  email: string;
  cargo: string;
  salarioBase: number;
  cargaHoraria: number; // horas/dia
  admissao: string; // ISO date (YYYY-MM-DD)
  banco?: string;
  ativo: boolean;
  role: Role;
  criadoEm: string; // ISO timestamp
}

export interface RegistroPonto {
  id: string;
  empresaId: string;
  colaboradorId: string;
  data: string; // YYYY-MM-DD
  entrada: string | null; // HH:mm
  saida: string | null; // HH:mm
  tipo: 'automatico' | 'manual';
  motivo?: string | null;
  editadoPor?: string | null; // uid do gestor, se editado
  editadoEm?: string | null; // ISO timestamp
  criadoEm: string; // ISO timestamp - server timestamp
}

export interface RegrasCalculo {
  empresaId: string;
  cargaDiaria: number;
  cargaSemanal: number;
  toleranciaMinutos: number;
  heUtilPercent: number;
  heDomingoFeriadoPercent: number;
  limiteHEMensal: number;
  descontoFaltaPercent: number;
}

export interface Holerite {
  id: string;
  empresaId: string;
  colaboradorId: string;
  mes: string; // YYYY-MM
  diasTrabalhados: number;
  totalHorasNormais: number;
  totalHorasExtras: number;
  totalHorasExtrasDomingoFeriado: number;
  salarioBase: number;
  valorHorasExtras: number;
  descontoFaltas: number;
  inss: number;
  fgts: number;
  liquido: number;
  geradoEm: string; // ISO timestamp
}

export interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
}
'@
New-FileIfMissing "src\types\index.ts" $typesContent

# ---------- src/lib/firebase/client.ts ----------
$clientContent = @'
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
'@
New-FileIfMissing "src\lib\firebase\client.ts" $clientContent

# ---------- src/lib/firebase/admin.ts ----------
$adminContent = @'
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('Variaveis de ambiente do Firebase Admin ausentes. Confira o .env.local');
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
'@
New-FileIfMissing "src\lib\firebase\admin.ts" $adminContent

# ---------- firestore.rules (raiz) ----------
$rulesContent = @'
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function empresaId() {
      return request.auth.token.empresaId;
    }

    function role() {
      return request.auth.token.role;
    }

    function isGestor(empId) {
      return isSignedIn() && empresaId() == empId && role() == 'gestor';
    }

    function isColaboradorDono(empId, colabId) {
      return isSignedIn() && empresaId() == empId
        && role() == 'colaborador'
        && request.auth.uid == colabId;
    }

    match /empresas/{empId} {
      allow read: if isSignedIn() && empresaId() == empId;
      allow write: if false; // criacao de empresa so via Admin SDK (server)

      match /colaboradores/{colabId} {
        allow read, write: if isGestor(empId);
        allow read: if isColaboradorDono(empId, colabId);
      }

      match /registros/{regId} {
        allow read, write: if isGestor(empId);

        allow read: if isSignedIn() && empresaId() == empId
          && role() == 'colaborador'
          && resource.data.colaboradorId == request.auth.uid;

        allow create: if isSignedIn() && empresaId() == empId
          && role() == 'colaborador'
          && request.resource.data.colaboradorId == request.auth.uid
          && request.resource.data.tipo == 'manual';
      }

      match /holerites/{holId} {
        allow read: if isGestor(empId)
          || (isSignedIn() && empresaId() == empId && role() == 'colaborador'
              && resource.data.colaboradorId == request.auth.uid);
        allow write: if false;
      }

      match /regras/{regrasId} {
        allow read: if isSignedIn() && empresaId() == empId;
        allow write: if isGestor(empId);
      }
    }
  }
}
'@
New-FileIfMissing "firestore.rules" $rulesContent

# ---------- .env.example (raiz) ----------
$envExampleContent = @'
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
'@
New-FileIfMissing ".env.example" $envExampleContent

# ---------- .env.local (raiz) - so' cria se nao existir ----------
New-FileIfMissing ".env.local" $envExampleContent

# ---------- scripts/seed-gestor.ts ----------
$seedContent = @'
import { adminAuth, adminDb } from '../src/lib/firebase/admin';
import { randomUUID } from 'crypto';

async function main() {
  const empresaId = randomUUID();
  const gestorEmail = 'SEU_EMAIL_AQUI@exemplo.com'; // TROCAR
  const gestorSenha = 'TROCAR_SENHA_TEMPORARIA_FORTE'; // TROCAR
  const gestorNome = 'SEU NOME'; // TROCAR

  await adminDb.collection('empresas').doc(empresaId).set({
    razaoSocial: 'Empresa PontoPro LTDA', // TROCAR
    cnpj: '00.000.000/0001-00', // TROCAR
    criadaEm: new Date().toISOString(),
  });

  const userRecord = await adminAuth.createUser({
    email: gestorEmail,
    password: gestorSenha,
    displayName: gestorNome,
  });

  await adminAuth.setCustomUserClaims(userRecord.uid, {
    role: 'gestor',
    empresaId,
  });

  await adminDb
    .collection('empresas').doc(empresaId)
    .collection('colaboradores').doc(userRecord.uid)
    .set({
      empresaId,
      uid: userRecord.uid,
      nome: gestorNome,
      cpf: '',
      email: gestorEmail,
      cargo: 'Gestor',
      salarioBase: 0,
      cargaHoraria: 8,
      admissao: new Date().toISOString().slice(0, 10),
      banco: '',
      ativo: true,
      role: 'gestor',
      criadoEm: new Date().toISOString(),
    });

  await adminDb
    .collection('empresas').doc(empresaId)
    .collection('regras').doc('config')
    .set({
      empresaId,
      cargaDiaria: 8,
      cargaSemanal: 44,
      toleranciaMinutos: 10,
      heUtilPercent: 50,
      heDomingoFeriadoPercent: 100,
      limiteHEMensal: 40,
      descontoFaltaPercent: 100,
    });

  console.log('Empresa criada:', empresaId);
  console.log('Gestor criado:', userRecord.uid, gestorEmail);
  console.log('Troque a senha temporaria no primeiro login.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro no seed:', err);
    process.exit(1);
  });
'@
New-FileIfMissing "scripts\seed-gestor.ts" $seedContent

Write-Host ""
Write-Host "==> Estrutura criada com sucesso." -ForegroundColor Cyan
Write-Host ""
Write-Host "PROXIMOS PASSOS MANUAIS:" -ForegroundColor Yellow
Write-Host "  1. npm install firebase firebase-admin"
Write-Host "  2. npm install -D firebase-tools tsx"
Write-Host "  3. Preencha o .env.local (na raiz do projeto) com as chaves do Firebase"
Write-Host "  4. Edite scripts\seed-gestor.ts trocando os campos marcados // TROCAR"
Write-Host "  5. Confirme que .gitignore contem: .env*.local"
Write-Host ""
Write-Host "Para validar: npm run build" -ForegroundColor Cyan
