#target aftereffects

(function () {
  function jsonEscape(value) {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\"')
      .replace(/\r/g, '\r')
      .replace(/\n/g, '\n');
  }

  function response(ok, message, extra) {
    var output = '{"ok":' + (ok ? 'true' : 'false') + ',"message":"' + jsonEscape(message) + '"';
    if (extra) {
      for (var key in extra) {
        if (extra.hasOwnProperty(key)) output += ',"' + jsonEscape(key) + '":"' + jsonEscape(extra[key]) + '"';
      }
    }
    return output + '}';
  }

  function sanitizeName(name) {
    var invalidChars = '\\/:*?"<>|';
    var i;
    name = String(name || '').replace(/^\s+|\s+$/g, '');
    name = name.replace(/\.aep$/i, '');
    for (i = 0; i < invalidChars.length; i++) {
      while (name.indexOf(invalidChars.charAt(i)) !== -1) name = name.replace(invalidChars.charAt(i), '_');
    }
    return name;
  }

  function selectedComp() {
    var project = app.project;
    var selection = project.selection;
    var i;
    for (i = 0; i < selection.length; i++) if (selection[i] instanceof CompItem) return selection[i];
    if (app.project.activeItem instanceof CompItem) return app.project.activeItem;
    return null;
  }

  function selectOnly(item) {
    var i;
    for (i = 1; i <= app.project.numItems; i++) app.project.item(i).selected = false;
    item.selected = true;
  }

  function isSameFile(first, second) {
    return first.fsName.toLowerCase() === second.fsName.toLowerCase();
  }

  function copyDestination(folder, sourceFile) {
    var fileName = sourceFile.name;
    var dot = fileName.lastIndexOf('.');
    var stem = dot > 0 ? fileName.substring(0, dot) : fileName;
    var extension = dot > 0 ? fileName.substring(dot) : '';
    var candidate = new File(folder.fsName + '/' + fileName);
    var number = 2;

    while (candidate.exists && !isSameFile(candidate, sourceFile)) {
      candidate = new File(folder.fsName + '/' + stem + '_' + number + extension);
      number++;
    }
    return candidate;
  }

  function collectReferencedFiles(project, destinationFolder) {
    var copiedFiles = {};
    var copiedCount = 0;
    var i;

    for (i = 1; i <= project.numItems; i++) {
      var item = project.item(i);
      if (!(item instanceof FootageItem)) continue;

      var sourceFile = null;
      try { sourceFile = item.file; } catch (sourceError) { sourceFile = null; }
      if (!sourceFile || !sourceFile.exists) continue;

      var sourceKey = sourceFile.fsName.toLowerCase();
      var collectedFile;
      if (copiedFiles[sourceKey]) {
        collectedFile = new File(copiedFiles[sourceKey]);
      } else {
        collectedFile = copyDestination(destinationFolder, sourceFile);
        if (!isSameFile(sourceFile, collectedFile)) {
          if (!sourceFile.copy(collectedFile.fsName)) {
            throw new Error('Não foi possível copiar o arquivo: ' + sourceFile.fsName);
          }
          copiedCount++;
        }
        copiedFiles[sourceKey] = collectedFile.fsName;
      }

      if (!isSameFile(sourceFile, collectedFile)) item.replace(collectedFile);
    }
    return copiedCount;
  }

  $.global.reduceComp_getSelectedCompInfo = function () {
    try {
      if (!app.project) return response(false, 'Abra um projeto do After Effects primeiro.');
      var comp = selectedComp();
      if (!comp) return response(false, 'Selecione uma composição no painel Projeto ou deixe-a ativa no painel Composição.');
      return response(true, 'Composição identificada.', {
        name: comp.name,
        suggestedName: sanitizeName(comp.name)
      });
    } catch (error) {
      return response(false, error.toString());
    }
  };

  $.global.reduceComp_exportSelected = function (requestedName) {
    var project = app.project;
    var originalFile = null;
    var openedReducedCopy = false;
    try {
      if (!project || !project.file) return response(false, 'Salve o projeto atual antes de criar a versão reduzida.');
      var comp = selectedComp();
      if (!comp) return response(false, 'Selecione uma composição no painel Projeto ou deixe-a ativa no painel Composição.');

      var name = sanitizeName(requestedName);
      if (!name) return response(false, 'Use um nome de arquivo válido.');

      originalFile = project.file;
      var targetName = comp.name;
      var suggestedFile = new File(originalFile.parent.fsName + '/' + name + '.aep');
      var chosenFile = suggestedFile.saveDlg('Salvar Fast Comp Collect como', 'Projeto do After Effects:*.aep');
      if (!chosenFile) return response(false, 'Operação cancelada.');
      if (!/\.aep$/i.test(chosenFile.name)) chosenFile = new File(chosenFile.fsName + '.aep');

      var packageName = sanitizeName(chosenFile.name);
      if (!packageName) return response(false, 'Use um nome de arquivo válido.');

      var collectFolder = new Folder(chosenFile.parent.fsName + '/' + packageName);
      if (!collectFolder.exists && !collectFolder.create()) {
        return response(false, 'Não foi possível criar a pasta do collect: ' + collectFolder.fsName);
      }
      var assetsFolder = new Folder(collectFolder.fsName + '/_assets');
      if (!assetsFolder.exists && !assetsFolder.create()) {
        return response(false, 'Não foi possível criar a pasta de assets: ' + assetsFolder.fsName);
      }
      var outputFile = new File(collectFolder.fsName + '/' + packageName + '.aep');
      if (outputFile.fsName.toLowerCase() === originalFile.fsName.toLowerCase()) {
        return response(false, 'Escolha um nome diferente do projeto original.');
      }
      if (outputFile.exists && !confirm('Já existe um arquivo com este nome. Substituir?')) {
        return response(false, 'Operação cancelada.');
      }

      app.beginUndoGroup('Criar projeto reduzido');
      if (project.dirty) project.save(originalFile);

      selectOnly(comp);
      project.save(outputFile);
      openedReducedCopy = true;
      project.reduceProject([comp]);
      var copiedCount = collectReferencedFiles(project, assetsFolder);
      project.save();

      app.open(originalFile);
      openedReducedCopy = false;

      return response(true, 'Arquivo reduzido criado, com ' + copiedCount + ' arquivo(s) de mídia coletado(s), e o projeto original foi reaberto.', {
        target: targetName,
        file: outputFile.fsName
      });
    } catch (error) {
      return response(false, 'Não foi possível criar o projeto reduzido: ' + error.toString());
    } finally {
      if (openedReducedCopy && originalFile) {
        try { app.open(originalFile); } catch (restoreError) {}
      }
      try { app.endUndoGroup(); } catch (ignore) {}
    }
  };
}());
