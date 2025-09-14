import { useState, useEffect } from "react"
import { Button } from "./components/ui/button"
import { Card, CardHeader, CardContent, CardFooter } from "./components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

type Sigil = {
  idSigil: number
  textFull: string
  text: string
  imageURL: string
  imageWidth: number
  imageHeight: number
  region: string
  level: number
}

type Question = {
  id: number
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  options: string[]
  answer: number
}

export default function HeraldryQuiz() {
  const [sigils, setSigils] = useState<Sigil[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [canProceed, setCanProceed] = useState(false)

  // Stats
  const [startTime, setStartTime] = useState(Date.now())


  // Difficulty level selection
  const [levelChoice, setLevelChoice] = useState<number | null>(null)

  // Data load from /public/sigils_db.json
  useEffect(() => {
    fetch("/sigils_db.json")
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger sigils_db.json")
        return res.json()
      })
      .then((data: Sigil[]) => {
        if (!Array.isArray(data)) throw new Error("Format JSON invalide : attendu un tableau")
        setSigils(data)
      })
      .catch((err) => {
        console.error("Erreur de chargement JSON :", err)
        alert("⚠️ Erreur lors du chargement du quiz : " + err.message)
      })
  }, [])

  // Level selection → questions generation
  const startQuiz = (level: number) => {
    if (!sigils.length) return

    // Difficulty level filter → The selected level includes the questions from the levels below too
	//Difficulty level can be changed gor each question in sigils_db.json
    const filtered = sigils.filter((s) => s.level <= level)

    // Randomized selection, limittaion to 10 questions
    const chosen = filtered.sort(() => Math.random() - 0.5).slice(0, 10)

    const generatedQuestions: Question[] = chosen.map((sigil, index) => {
      const otherChoices = filtered
        .filter((s) => s.idSigil !== sigil.idSigil)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)

      const allOptions = [...otherChoices.map((s) => s.text), sigil.text]
      const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)
      const answerIndex = shuffledOptions.indexOf(sigil.text)

      return {
        id: index + 1,
        image: sigil.imageURL,
        imageAlt: sigil.textFull,
        imageWidth: sigil.imageWidth,
        imageHeight: sigil.imageHeight,
        options: shuffledOptions,
        answer: answerIndex,
      }
    })

    setQuestions(generatedQuestions)
    setLevelChoice(level)
    setCurrent(0)
    setScore(0)
    setSelected(null)
    setFinished(false)
    setCanProceed(false)
    setStartTime(Date.now())
  }

  // Welcome screen → level selection
  if (levelChoice === null) {
    if (!sigils.length) {
      return <p className="text-center text-yellow-900">Chargement du quiz...</p>
    }

    const randomSigil = sigils[Math.floor(Math.random() * sigils.length)]

    return (
      <Card className="w-[28rem] shadow-xl bg-[url('/parchment.jpg')] bg-cover border-4 border-yellow-900">
        <CardHeader>
          <h2 className="text-2xl font-serif text-yellow-900">🏰 Quiz sur les blasons</h2>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <img
            src={randomSigil.imageURL}
            alt={randomSigil.textFull}
            width={randomSigil.imageWidth}
            height={randomSigil.imageHeight}
            className="object-contain mb-4"
          />
          <p className="font-serif text-yellow-900">Niveau de difficulté :</p>
          <div className="flex flex-col gap-2 w-full">
            <Button className="bg-green-700 text-white" onClick={() => startQuiz(1)}>
              Novice
            </Button>
            <Button className="bg-blue-700 text-white" onClick={() => startQuiz(2)}>
              Acolyte
            </Button>
            <Button className="bg-purple-700 text-white" onClick={() => startQuiz(3)}>
              Mestre
            </Button>
            <Button className="bg-red-700 text-white" onClick={() => startQuiz(4)}>
              Archimestre
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Result screen
  if (finished) {
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    const percent = Math.round((score / questions.length) * 100)

    return (
      <Card className="w-[28rem] shadow-2xl text-center bg-[url('/parchment.jpg')] bg-cover border-4 border-yellow-900">
        <CardHeader>
          <h2 className="text-2xl font-serif text-yellow-900">🏰 Quiz terminé 🎉</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-800 font-medium">
            Score : {score} / {questions.length} ({percent}%)
          </p>
          <p className="text-gray-700">Temps total : {totalTime} sec</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            className="bg-yellow-900 hover:bg-yellow-800 text-white rounded-2xl"
            onClick={() => setLevelChoice(null)}
          >
            Rejouer
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const question = questions[current]

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)

    if (idx === question.answer) {
      setScore((s) => s + 1)
    } 

    setCanProceed(true)
  }

  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1)
      setSelected(null)
      setCanProceed(false)
    } else {
      setFinished(true)
    }
  }

  // Quiz screen
  return (
    <Card className="w-[28rem] shadow-xl bg-[url('/parchment.jpg')] bg-cover border-4 border-yellow-900">
      <CardHeader>
        <h2 className="text-xl font-serif text-yellow-900">
          Question {current + 1} / {questions.length}
        </h2>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <img
              src={question.image}
              alt={question.imageAlt}
              width={question.imageWidth}
              height={question.imageHeight}
              className="object-contain mb-4"
            />

            {question.options.map((opt, idx) => {
              let baseStyle = "transition-all duration-300 w-full"
              let extra = ""

              if (selected !== null) {
                if (idx === question.answer) extra = "bg-green-600 text-white"
                else if (idx === selected && idx !== question.answer) extra = "bg-red-600 text-white"
                else extra = "opacity-70"
              } else if (selected === idx) {
                extra = "bg-gray-800 text-white"
              } else {
                extra = "bg-yellow-900 text-white"
              }

              return (
                <Button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`${baseStyle} ${extra}`}
                  disabled={selected !== null}
                >
                  {opt}
                </Button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </CardContent>

      <CardFooter className="flex justify-center">
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-yellow-900 hover:bg-yellow-800 text-white rounded-2xl transition-all duration-300"
        >
          Suivant →
        </Button>
      </CardFooter>
    </Card>
  )
}
