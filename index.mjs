import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000
const DELAY_MS = parseInt(process.env.DELAY_MS) || 10000

app.post('/psp/pay', async (req, res) => {
  const { transactionId, amount, callbackUrl, card } = req.body

  if (!transactionId || !amount || !callbackUrl) {
    return res.status(400).json({
      error: 'transactionId, amount et callbackUrl requis.'
    })
  }

  console.log(`[PSP] Paiement reçu pour transaction ${transactionId} - Attente ${DELAY_MS}ms`)
  console.log(`[PSP] Carte reçue : ${card?.number || '[Aucune carte]'}`)

  setTimeout(async () => {
    const isValidCard =
      card &&
      typeof card.number === 'string' &&
      card.number.replace(/\s/g, '') === '4242424242424242'

    const status = isValidCard ? 'success' : 'failed'

    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          status,
          amount,
          timestamp: new Date()
        })
      })

      console.log(
        `[PSP] Notification envoyée à ${callbackUrl} (status HTTP ${response.status})`
      )
    } catch (err) {
      console.error('[PSP]  Erreur lors de la notification :', err.message)
    }
  }, DELAY_MS)

  res.json({ message: 'Paiement émulé en cours', transactionId })
})

app.post('/simulate-payment', async (req, res) => {
  const { transactionId, status = 'success', delay = 10000 } = req.body

  console.log(`Paiement simulé en cours (ID ${transactionId})... Attente ${delay} ms`)

  setTimeout(async () => {
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, status })
      })

      const result = await response.json()
      console.log('Notification envoyée au backend principal :', result)
    } catch (err) {
      console.error('Erreur lors de la notification :', err.message)
    }
  }, delay)

  res.json({ message: 'Paiement simulé en cours...' })
})

app.listen(PORT, () => {
  console.log(`🚀 PSP Mock Server lancé sur http://localhost:${PORT}`)
})
