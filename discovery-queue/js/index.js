import 'react-select/dist/react-select.css'
import '../css/discovery.scss';
import Select from 'react-select'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'
import { Alert, ProgressBar, Button, Row, Col, Glyphicon, FormGroup } from 'react-bootstrap'
import CardImage from '../../set-detail/js/components/cardImage'


const CHOICES_API = window.django.choices_api
const QUEUE_API = window.django.queue_api


function DiscoveryQueue() {
    const [queue, setQueue] = useState(null)
    const [current, setCurrent] = useState(null)
    const [loading, setLoading] = useState(false)
    const [position, setPosition] = useState(0)
    const [error, setError] = useState(null)
    const [colors, setColors] = useState([])
    const [cardType, setCardtype] = useState('')
    const [choices, setChoices] = useState({})

    const colorChoices = [
        { 'label': 'White', 'value': 'W' },
        { 'label': 'Blue', 'value': 'U' },
        { 'label': 'Black', 'value': 'B' },
        { 'label': 'Red', 'value': 'R' },
        { 'label': 'Green', 'value': 'G' },
    ]

    const typeChoices = [
        { 'label': 'Instant', 'value': 'Instant' },
        { 'label': 'Sorcery', 'value': 'Sorcery' },
        { 'label': 'Enchantment', 'value': 'Enchantment' },
        { 'label': 'Artifact', 'value': 'Artifact' },
        { 'label': 'Planeswalker', 'value': 'Planeswalker' },
        { 'label': 'Creature', 'value': 'Creature' },
        { 'label': 'Land', 'value': 'Land' },
        { 'label': 'Battle', 'value': 'Battle' },
    ]

    const startQueue = async () => {
        setLoading(true)
        setQueue(null)
        setCurrent(null)
        setPosition(0)
        setError(null)
        try {
            const params = []
            for (const color of colors) {
                params.push(`colors=${color.value}`)
            }
            if (cardType) params.push(`type=${cardType.value}`)
            let url = QUEUE_API
            if (params.length) url += `?${params.join('&')}`
            const response = await axios.get(url)
            setQueue(response.data.queue)
            setCurrent(response.data.queue[0])
            setLoading(false)
        } catch (error) {
            setError('Error getting queue. Try again in a few seconds.')
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        const fetchChoices = async () => {
            try {
                const response = await axios.get(CHOICES_API)
                setChoices(response.data.choices)
                startQueue()
            } catch (error) {
                setError('Error getting queue. Please refresh the page.')
                setLoading(false)
            }
        }
        fetchChoices()
    }, [])

    const nextItem = () => {
        setPosition(position + 1)
        setCurrent(queue[position + 1])
    }

    let next = (<Button bsStyle="success" bsSize="large" onClick={startQueue}>Start new Queue</Button>)
    if (queue && queue.length > position + 1) {
        next = (
            <Button bsStyle="success" bsSize="large" onClick={nextItem}>
                Next ({position + 1} / {queue.length}) <Glyphicon glyph="chevron-right" />
            </Button>
        )
    }

    return (
        <div>
            <Row style={{ 'margin-bottom': '20px' }}>
                <Col lgOffset={2} lg={3} md={4} sm={4} xs={4}>
                    <Select
                        value={cardType}
                        onChange={setCardtype}
                        placeholder="Type"
                        options={typeChoices}
                    />
                </Col>
                <Col lg={3} md={4} sm={4} xs={4}>
                    <Select
                        multi
                        value={colors}
                        onChange={setColors}
                        placeholder="Colors"
                        options={colorChoices}
                        multiple={true}
                    />
                </Col>
                <Col lg={3} md={4} sm={4} xs={4}>
                    <Button bsStyle="success" onClick={startQueue}>Start new Queue</Button>
                </Col>
            </Row>
            <hr />
            <Row>
                <Col lg={12} md={12} sm={12} xs={12}>
                    {error && <Alert bsStyle="danger">{error}</Alert>}
                    {loading && <ProgressBar active now={100} />}
                </Col>
            </Row>
            {current &&
                <div className="flex-container">
                    <div>
                        <CardImage 
                            default_tla={current.tla} 
                            spec={current}
                            width={window.django.is_mobile ? 300 : 400}
                            backsides={{}}
                            choices={choices}
                        />
                    </div>
                    <div className='next-btns-container'>
                        <p>{next}</p>
                        <p>
                            <a href={current.url} style={{ 'margin-top': '10px' }} className='btn btn-sm btn-info' target="_blank">
                                Check detail page for similar, alters and more! <Glyphicon glyph="new-window" />
                            </a>
                        </p>
                    </div>
                </div>
            }
        </div>
    )
}

ReactDOM.render(<DiscoveryQueue />, document.getElementById('queue-root'))
