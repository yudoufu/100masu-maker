(() => {
  const OPERATIONS = {
    add: {
      label: 'たし算',
      symbol: '＋',
      columnHeader: (number) => number,
      answer: (row, column) => row + column,
    },
    subtract: {
      label: 'ひき算',
      symbol: '−',
      columnHeader: (number) => number + 10,
      answer: (row, column) => column + 10 - row,
    },
    multiply: {
      label: 'かけ算',
      symbol: '×',
      columnHeader: (number) => number,
      answer: (row, column) => row * column,
    },
  };

  const state = {
    operation: 'add',
    numberLimit: 9,
    order: 'random',
    sheetCount: 1,
    gridSize: 10,
    worksheets: [],
  };
  const elements = {
    operationButtons: [...document.querySelectorAll('#operation button')],
    themeOptions: [...document.querySelectorAll('input[name="theme"]')],
    themeColor: document.querySelector('meta[name="theme-color"]'),
    range: document.getElementById('range'),
    gridSize: document.getElementById('gridSize'),
    difficulty: document.getElementById('difficulty'),
    copies: document.getElementById('copies'),
    generateButton: document.getElementById('generate'),
    printQuestionsButton: document.getElementById('printQuestionsBtn'),
    printAnswersButton: document.getElementById('printAnswersBtn'),
    stageCount: document.getElementById('stageCount'),
    worksheets: document.getElementById('sheets'),
    sheetTemplate: document.getElementById('sheetTemplate'),
  };

  function shuffle(values) {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    return values;
  }

  function createNumberSequence() {
    const poolSize = state.numberLimit + 1;
    const numbers = [];

    while (numbers.length < state.gridSize) {
      const pool = shuffle(Array.from({ length: poolSize }, (_, index) => index));
      const remaining = state.gridSize - numbers.length;
      numbers.push(...pool.slice(0, remaining));
    }

    if (state.order === 'ascending') {
      return numbers.sort((a, b) => a - b);
    }
    if (state.order === 'descending') {
      return numbers.sort((a, b) => b - a);
    }
    return shuffle(numbers);
  }

  function createWorksheet() {
    return {
      rows: createNumberSequence(),
      columns: createNumberSequence(),
    };
  }

  function createCell(className, content) {
    const cell = document.createElement('div');
    cell.className = `cell ${className}`;
    cell.textContent = content;
    return cell;
  }

  function buildGrid(sheet, worksheet, worksheetNumber, isAnswer) {
    const operation = OPERATIONS[state.operation];
    const grid = sheet.querySelector('.math-grid');
    const gridTotal = state.gridSize + 1;
    const rowHeight = 165 / gridTotal;

    grid.setAttribute(
      'aria-label',
      `計算問題 ${worksheetNumber}${isAnswer ? '枚目の答え' : '枚目'}`,
    );
    grid.style.setProperty('--grid-total', gridTotal);
    grid.style.setProperty('--grid-row-height', `${rowHeight}mm`);
    grid.classList.toggle('dense', state.gridSize > 12);
    grid.append(createCell('corner', operation.symbol));

    worksheet.columns.forEach((number) => {
      grid.append(createCell('head', operation.columnHeader(number)));
    });

    worksheet.rows.forEach((rowNumber) => {
      grid.append(createCell('head', rowNumber));

      worksheet.columns.forEach((columnNumber) => {
        const answer = operation.answer(rowNumber, columnNumber);
        const content = isAnswer ? answer : '';
        grid.append(createCell('question', content));
      });
    });
  }

  function buildSheet(worksheet, index, isAnswer) {
    const sheet = elements.sheetTemplate.content.firstElementChild.cloneNode(true);
    const worksheetNumber = index + 1;
    const operation = OPERATIONS[state.operation];
    const title = sheet.querySelector('.sheet-title');

    title.textContent = `${operation.label} ${state.gridSize}×${state.gridSize}ます計算　${isAnswer ? '答え ' : ''}No. ${worksheetNumber}`;
    sheet.setAttribute('aria-label', title.textContent);
    sheet.classList.add(isAnswer ? 'answer-sheet' : 'question-sheet');
    buildGrid(sheet, worksheet, worksheetNumber, isAnswer);
    return sheet;
  }

  function renderWorksheets() {
    const fragment = document.createDocumentFragment();

    state.worksheets.forEach((worksheet, index) => {
      fragment.append(buildSheet(worksheet, index, false));
    });

    elements.worksheets.replaceChildren(fragment);
    elements.stageCount.textContent = `${state.sheetCount}枚`;
  }

  function generateWorksheets() {
    state.worksheets = Array.from({ length: state.sheetCount }, createWorksheet);
    renderWorksheets();
  }

  function selectOperation(button) {
    state.operation = button.dataset.op;
    elements.operationButtons.forEach((operationButton) => {
      const isSelected = operationButton === button;
      operationButton.classList.toggle('active', isSelected);
      operationButton.setAttribute('aria-pressed', String(isSelected));
    });
    generateWorksheets();
  }

  function printWorksheets(mode) {
    if (mode === 'answers') {
      const fragment = document.createDocumentFragment();
      state.worksheets.forEach((worksheet, index) => {
        const answerSheet = buildSheet(worksheet, index, true);
        answerSheet.classList.add('temporary-print-sheet');
        fragment.append(answerSheet);
      });
      elements.worksheets.append(fragment);
    }

    document.documentElement.dataset.printMode = mode;
    window.print();
  }

  function finishPrinting() {
    delete document.documentElement.dataset.printMode;
    elements.worksheets.querySelectorAll('.temporary-print-sheet').forEach((sheet) => sheet.remove());
  }

  elements.operationButtons.forEach((button) => {
    button.addEventListener('click', () => selectOperation(button));
  });

  elements.themeOptions.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        document.documentElement.dataset.theme = input.value;
        elements.themeColor.content = getComputedStyle(document.documentElement)
          .getPropertyValue('--background')
          .trim();
      }
    });
  });

  elements.range.addEventListener('change', (event) => {
    state.numberLimit = Number(event.target.value);
    generateWorksheets();
  });

  elements.gridSize.addEventListener('change', (event) => {
    state.gridSize = Number(event.target.value);
    generateWorksheets();
  });

  elements.difficulty.addEventListener('change', (event) => {
    state.order = event.target.value;
    generateWorksheets();
  });

  elements.copies.addEventListener('change', (event) => {
    state.sheetCount = Number(event.target.value);
    generateWorksheets();
  });

  elements.generateButton.addEventListener('click', generateWorksheets);
  elements.printQuestionsButton.addEventListener('click', () => printWorksheets('questions'));
  elements.printAnswersButton.addEventListener('click', () => printWorksheets('answers'));
  window.addEventListener('afterprint', finishPrinting);

  generateWorksheets();
})();
