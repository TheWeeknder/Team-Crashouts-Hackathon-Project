function EventItem({ event }) {
  return (
    <p className={event.project.colour}>{event.title} | {event.remaining_hours}</p>
  )
}

export default EventItem