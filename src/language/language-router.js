const express = require("express");
const LanguageService = require("./language-service");
const { requireAuth } = require("../middleware/jwt-auth");
const linkedList = require("./linkedList");

const languageRouter = express.Router();
const jsonBodyParser = express.json();

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get("db"),
      req.user.id,
    );

    if (!language)
      return res.status(404).json({
        error: "You don't have any languages",
      });

    req.language = language;
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get("/", async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get("db"),
      req.language.id,
    );

    res.json({
      language: req.language,
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get("/head", async (req, res, next) => {
  // implement me
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get("db"),
      req.language.user_id,
    );
    const words = await LanguageService.getLanguageWords(
      req.app.get("db"),
      req.language.id,
    );
    const currentWord = words.find(element => element.id === language.head);
    const responseObject = {
      nextWord: currentWord.original,
      wordCorrectCount: currentWord.correct_count,
      wordIncorrectCount: currentWord.incorrect_count,
      totalScore: language.total_score,
    };
    res.json(responseObject);
  } catch (error) {
    next(error);
  }
});

languageRouter.post("/guess", jsonBodyParser, async (req, res, next) => {
  const { guess } = req.body;
  if (guess === undefined) {
    return res.status(400).json({ error: "Missing 'guess' in request body" });
  }
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get("db"),
      req.language.user_id,
    );
    const words = await LanguageService.getLanguageWords(
      req.app.get("db"),
      req.language.id,
    );
    const startingList = new linkedList();
    words.forEach(word => startingList.pushItem(word));
    console.log(startingList.head);
    let isCorrect = false;
    let memV = 1;
    let currList = startingList;
    let target = startingList.head;
    if (guess === startingList.head.data) {
      isCorrect = true;
      memV *= 2;
      await LanguageService.correctAnswer(
        req.app.get("db"),
        target.id,
        target.correct_count,
      );
      await LanguageService.incrementTotalScore(
        req.app.get("db"),
        target.id,
        language.total_score,
      );
    } else {
      memV = 1;
      currList.remove(target);
      currList.insertAt(target, memV);
    }
    let resObj = {
      answer: startingList.head.data.translation,
      isCorrect: isCorrect,
      nextWord: currList.head.data.original,
      totalScore: language.total_score,
      // wordCorrectCount: 0,
      // wordIncorrectCount: 0,
    };
    res.json(resObj);
  } catch (error) {
    next(error);
  }

  //   const word = words.find(element => element.id === language.head);
  //   const list = new linkedList();
  //   await LanguageService.updateLanguageHead(
  //     req.app.get("db"),
  //     req.language.user_id,
  //     words.find(element => element.id === language.head).next,
  //   );
  //   let currWord = words.find(element => element.id === language.head);
  //   while (currWord.next !== null) {
  //     list.insertLast(currWord);
  //     currWord = words.find(element => element.id === currWord.next);
  //   }
  //   list.insertLast(currWord);
  //   list.remove(word);
  //   if (guess === word.translation) {
  //     await LanguageService.correctAnswer(
  //       req.app.get("db"),
  //       word.id,
  //       word.correct_count,
  //     );
  //     await LanguageService.incrementTotalScore(
  //       req.app.get("db"),
  //       req.language.user_id,
  //       language.total_score,
  //     );
  //     await LanguageService.updateMemValue(
  //       req.app.get("db"),
  //       word.id,
  //       word.memory_value * 2,
  //     );
  //     list.insertAt(word, word.memory_value * 2);
  //   } else {
  //     await LanguageService.incorrectAnswer(
  //       req.app.get("db"),
  //       word.id,
  //       word.incorrect_count,
  //     );
  //     await LanguageService.updateMemValue(req.app.get("db"), word.id, 1);
  //     list.insertAt(word, 1);
  //   }
  //   currWord = list.head;
  //   list.display();
  //   while (currWord.next !== null) {
  //     await LanguageService.updateNextValue(
  //       req.app.get("db"),
  //       currWord.value.id,
  //       currWord.next.value.id,
  //     );
  //     currWord = currWord.next;
  //   }

  //   const newWords = await LanguageService.getLanguageWords(
  //     req.app.get("db"),
  //     req.language.id,
  //   );
  //   const newWord = newWords.find(element => element.id === language.head);
  //   const newLanguage = await LanguageService.getUsersLanguage(
  //     req.app.get("db"),
  //     req.language.user_id,
  //   );

  //   await LanguageService.updateNextValue(
  //     req.app.get("db"),
  //     currWord.value.id,
  //     null,
  //   );
  //   const responseObject = {
  //     nextWord: newWords.find(nw => nw.id === newLanguage.head).original,
  //     wordCorrectCount: newWord.correct_count,
  //     wordIncorrectCount: newWord.incorrect_count,
  //     totalScore: newLanguage.total_score,
  //     answer: word.translation,
  //     isCorrect: guess === word.translation,
  //   };
  //   res.json(responseObject);
});

module.exports = languageRouter;
