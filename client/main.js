(function () {
  'use strict';

  var bridge = window.__adobe_cep__;
  var selectedComp = document.getElementById('selectedComp');
  var fileName = document.getElementById('fileName');
  var status = document.getElementById('status');
  var createButton = document.getElementById('createButton');

  function escapeForExtendScript(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
  }

  function hostScript(expression, callback) {
    if (!bridge) {
      callback({ ok: false, message: 'Este painel precisa ser aberto dentro do After Effects.' });
      return;
    }

    var hostPath = bridge.getSystemPath('extension') + '/host/reduce_to_comp.jsx';
    var loadCommand = "$.evalFile('" + escapeForExtendScript(hostPath) + "');";
    bridge.evalScript(loadCommand, function () {
      bridge.evalScript(expression, function (raw) {
        try { callback(JSON.parse(raw)); }
        catch (error) { callback({ ok: false, message: raw || 'O After Effects não retornou uma resposta válida.' }); }
      });
    });
  }

  function setStatus(message, isError) {
    status.textContent = message || '';
    status.className = isError ? 'status error' : 'status';
  }

  function refreshSelection() {
    setStatus('');
    hostScript('reduceComp_getSelectedCompInfo()', function (result) {
      if (!result.ok) {
        selectedComp.textContent = 'Nenhuma composição identificada';
        setStatus(result.message, true);
        return;
      }
      selectedComp.textContent = result.name;
      fileName.value = result.suggestedName;
    });
  }

  document.getElementById('refreshButton').addEventListener('click', refreshSelection);
  createButton.addEventListener('click', function () {
    var name = fileName.value.replace(/^\s+|\s+$/g, '');
    if (!name) {
      setStatus('Informe o nome do novo arquivo.', true);
      fileName.focus();
      return;
    }
    createButton.disabled = true;
    setStatus('Escolha onde salvar o Fast Comp Collect…');
    hostScript("reduceComp_exportSelected('" + escapeForExtendScript(name) + "')", function (result) {
      createButton.disabled = false;
      setStatus(result.message, !result.ok);
      if (result.ok) selectedComp.textContent = result.target || selectedComp.textContent;
    });
  });

  refreshSelection();
}());
