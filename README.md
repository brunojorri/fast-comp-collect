# Fast Comp Collect

Extensão CEP para o Adobe After Effects que cria uma cópia reduzida e autocontida da composição selecionada.

## Como funciona

1. Selecione uma composição no painel **Projeto** (ou deixe a composição ativa).
2. Abra **Janela > Extensões (Legado) > Fast Comp Collect**.
3. O nome começa igual ao da composição; ajuste-o se quiser e clique em **Criar arquivo reduzido**.
4. Na janela padrão **Salvar como**, escolha a pasta-mãe de destino e confirme o nome.

O painel abre a janela padrão **Salvar como** para definir a pasta-mãe e o nome do collect. Em seguida, cria dentro dela uma pasta com o nome escolhido e salva nela o `.aep` reduzido. A pasta também recebe uma subpasta `_assets` com todas as mídias de arquivo usadas; o projeto reduzido é religado a essas cópias. Caso existam nomes de arquivo iguais vindos de pastas diferentes, o painel acrescenta um número para não sobrescrever nada.

O projeto original não é reduzido. Antes de exportar, ele é salvo para preservar alterações pendentes. Ao finalizar, o After Effects reabre automaticamente o projeto original; o `.aep` reduzido fica salvo no disco, pronto para ser aberto ou enviado quando necessário.

## Instalação pelo PowerShell

Depois de baixar ou clonar este repositório, abra o PowerShell dentro da pasta dele e execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-extension.ps1
```

Ou, em uma única linha após clonar o repositório:

```powershell
git clone https://github.com/brunojorri/fast-comp-collect.git; cd fast-comp-collect; powershell -ExecutionPolicy Bypass -File .\install-extension.ps1
```

Reinicie o After Effects e abra **Janela > Extensões (Legado) > Fast Comp Collect**.

## Instalação local manual

Execute `install-extension.ps1` no PowerShell. Depois, reinicie o After Effects.

Se o painel não aparecer, habilite **Preferências > Scripts e expressões > Permitir que scripts gravem arquivos e acessem a rede** e ative extensões não assinadas no ambiente de desenvolvimento CEP.

## Estrutura gerada

Ao escolher uma pasta-mãe no diálogo padrão **Salvar como**, a extensão cria um pacote organizado:

```text
Pasta escolhida/
└── nome-do-collect/
    ├── nome-do-collect.aep
    └── _assets/
        ├── footage.mov
        └── imagem.png
```
