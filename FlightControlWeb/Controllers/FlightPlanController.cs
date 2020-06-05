using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlightControlWeb.Models;
using System.Net;
using System.IO;
using Newtonsoft.Json;

namespace FlightControlWeb.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FlightPlanController : ControllerBase
    {
        private readonly DBContext _context;
        public FlightPlanController(DBContext context)
        {
            _context = context;
        }

        // GET: api/FlightPlan
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FlightPlan>>> GetFlightPlan(object value)
        {
            List<FlightPlan> list = await _context.FlightPlan.ToListAsync();
            // insert all the location's data and segments's data
            foreach (FlightPlan flight in list)
            {
                string tempId = flight.id;
                List<Location> locationsList = await _context.Locations.ToListAsync();
                List<Segment> segmentsList = await _context.Segments.ToListAsync();
                //get the location and the segments according to the id
                Location thisLocation = locationsList.Where(a => a.id == tempId).First();
                List<Segment> thisSegments = segmentsList.Where(a => a.id == tempId).ToList();

                flight.Segments = thisSegments;
                flight.Initial_location = thisLocation;
            }
            return await _context.FlightPlan.ToListAsync();
        }


        // return true if the begining of a is equal to b
        private bool beginWith(string a, string begining)
        {
            if (string.Compare(a.Substring(0, 6), begining) == 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }


        // gat all flights from external servers
        private FlightPlan getFromExternalServer(string serverUrl, string flightId)
        {
            // cretae the url
            string url = serverUrl;
            url = string.Concat(url, "/api/FlightPlan");
            url = string.Concat(url, "/");
            url = string.Concat(url, flightId);
            string urlPath = string.Format(url);
            WebRequest requestObjGet = WebRequest.Create(urlPath);
            requestObjGet.Method = "GET";
            HttpWebResponse responseObjGet = null;
            responseObjGet = (HttpWebResponse)requestObjGet.GetResponse();
            string strRes = null;
            FlightPlan flightPlan = null;
            using (Stream stream = responseObjGet.GetResponseStream())
            {
                StreamReader sr = new StreamReader(stream);
                strRes = sr.ReadToEnd();
                sr.Close();
            }
            // convert to Json
            flightPlan = JsonConvert.DeserializeObject<FlightPlan>(strRes);
            flightPlan.is_external = true;
            return flightPlan;
        }


        // GET: api/FlightPlan/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FlightPlan>> GetFlightPlan(string id)
        {
            // check if this is id of internal flight
            var flightPlan = await _context.FlightPlan.FindAsync(id);

            // the id doesnt exist or this is id of external flight
            if (flightPlan == null)
            {
                // check if this is id of external flight
                List<ExternalFlights> externalFlights = await _context.flightToServer.ToListAsync();
                // if the id exist in external server - ask the eternal server
                ExternalFlights ef = _context.flightToServer.Find(id);
                if (ef != null)
                {
                    return getFromExternalServer(ef.serverUrl, ef.flightId);
                }
                return NotFound();
            }
            else
            {
                string tempId = flightPlan.id;
                List<Location> locationsList = await _context.Locations.ToListAsync();
                List<Segment> segmentsList = await _context.Segments.ToListAsync();
                //get the location and the segments according to the id
                Location thisLocation = locationsList.Where(a => a.id == tempId).First();
                List<Segment> thisSegments = segmentsList
                    .Where(a => beginWith(a.id, tempId) == true).ToList();

                flightPlan.Segments = thisSegments;
                flightPlan.Initial_location = thisLocation;
                return flightPlan;
            }
        }

        // Create random ID - big,big,small,small, number,number
        public string createRandomId()
        {
            var charsBig = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var charsSmall = "abcdefghijklmnopqrstuvwxyz";
            var nums = "0123456789";
            var stringChars = new char[6];
            var random = new Random();
            stringChars[0] = charsBig[random.Next(charsBig.Length)];
            stringChars[1] = charsBig[random.Next(charsBig.Length)];
            stringChars[2] = charsSmall[random.Next(charsBig.Length)];
            stringChars[3] = charsSmall[random.Next(charsSmall.Length)];
            stringChars[4] = nums[random.Next(nums.Length)];
            stringChars[5] = nums[random.Next(nums.Length)];
            return new String(stringChars);
        }


        // return true if there is invalid long or lat in one of the segments
        private bool thereIsAInvaldSegment(List<Segment> segmentList)
        {
            foreach (Segment s in segmentList)
            {
                if (s.Longitude < -180 || s.Longitude > 180 || s.Latitude < -90 || s.Latitude > 90)
                {
                    return true;
                }
            }
            return false;
        }



        [HttpPost]
        public async Task<ActionResult<FlightPlan>> PostFlightPlan(FlightPlan flightPlan)
        {
            // if the data is invalid - return error
            if (flightPlan.company_name == null || flightPlan.Segments == null ||
                flightPlan.Initial_location == null
                || flightPlan.passengers <= 0 || flightPlan.Initial_location.Latitude < -90 ||
                flightPlan.Initial_location.Latitude > 90
                || flightPlan.Initial_location.Longitude < -180 ||
                flightPlan.Initial_location.Longitude > 180 ||
                thereIsAInvaldSegment(flightPlan.Segments))
            {
                Response.StatusCode = 422;
                return Content("Invalid data");
                //return BadRequest();
            }
            flightPlan.is_external = false;
            flightPlan.id = createRandomId();
            var segmentList = flightPlan.Segments;
            int i = 0;
            foreach (Segment s in segmentList)
            {
                s.id = string.Concat(flightPlan.id, i.ToString());
                i++;
                // insert the segments to the DB
                _context.Segments.Add(s);
            }

            flightPlan.Initial_location.id = flightPlan.id;
            // insert the location to the DB of the locations.
            _context.FlightPlan.Add(flightPlan);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetFlightPlan", new { id = flightPlan.id }, flightPlan);
        }


        // DELETE: api/FlightPlan/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<FlightPlan>> DeleteFlightPlan(string id)
        {
            var flightPlan = await _context.FlightPlan.FindAsync(id);
            if (flightPlan == null)
            {
                return NotFound();
            }

            _context.FlightPlan.Remove(flightPlan);
            await _context.SaveChangesAsync();

            return flightPlan;
        }

        // Check if flight exist
        private bool FlightPlanExists(string id)
        {
            return _context.FlightPlan.Any(e => e.id == id);
        }

    }

}