import EventItem from "./EventItem.tsx";

function EventList({ events }) {
  return (
    <div>
      <ul>
        {events.map((event: object) => (
          <li>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EventList