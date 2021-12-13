package kr.co.ltdb.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.co.ltdb.entity.Member;
import kr.co.ltdb.repository.MemberRepository;

@RestController
@RequestMapping("/api")
public class MemberController {
	
	@Autowired
	MemberRepository memberRepository;
	
    @GetMapping("/members")
	public ResponseEntity<List<Member>> getAllMembers(@RequestParam(required = false) String name) {
		try {
			List<Member> members = new ArrayList<Member>();

			if (name == null)
				memberRepository.findAll().forEach(members::add);
			else
				memberRepository.findByNameContaining(name).forEach(members::add);

			if (members.isEmpty()) {
				return new ResponseEntity<>(HttpStatus.NO_CONTENT);
			}

			return new ResponseEntity<>(members, HttpStatus.OK);
		} catch (Exception e) {
			return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping("/members/{id}")
	public ResponseEntity<Member> getMemberById(@PathVariable("id") long id) {
		Optional<Member> memberData = memberRepository.findById(id);

		if (memberData.isPresent()) {
			return new ResponseEntity<>(memberData.get(), HttpStatus.OK);
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}

	@PostMapping(value="/members/create")
	//@RequestMapping(value = "/members/create", method= {RequestMethod.POST})
	public ResponseEntity<Member> createMember(@RequestParam String name, String pw) {
		try {
			Member _member = memberRepository
					.save(new Member(name, pw));
			return new ResponseEntity<>(_member, HttpStatus.CREATED);
		} catch (Exception e) {
			return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping("/members/{id}")
	public ResponseEntity<Member> updateMember(@PathVariable("id") long id, @RequestBody Member member) {
		Optional<Member> memberData = memberRepository.findById(id);

		if (memberData.isPresent()) {
			Member _member = memberData.get();
			_member.setName(member.getName());
			_member.setPw(member.getPw());
			return new ResponseEntity<>(memberRepository.save(_member), HttpStatus.OK);
		} else {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
	}

	@DeleteMapping("/members/{id}")
	public ResponseEntity<HttpStatus> deleteMember(@PathVariable("id") long id) {
		try {
			memberRepository.deleteById(id);
			return new ResponseEntity<>(HttpStatus.NO_CONTENT);
		} catch (Exception e) {
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping("/members")
	public ResponseEntity<HttpStatus> deleteAllTutorials() {
		try {
			memberRepository.deleteAll();
			return new ResponseEntity<>(HttpStatus.NO_CONTENT);
		} catch (Exception e) {
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}

	}
	
	@PostMapping("/members/name")
	public ResponseEntity<List<Member>> findByName(String name) {
		try {
			List<Member> members = memberRepository.findByName(name);

			if (members.isEmpty()) {
				return new ResponseEntity<>(HttpStatus.NO_CONTENT);
			}
			return new ResponseEntity<>(members, HttpStatus.OK);
		} catch (Exception e) {
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PostMapping("/members/login")
	public ResponseEntity<List<Member>> findByNameAndPw(String name, String pw) {
		try {
			List<Member> members = memberRepository.findByNameAndPw(name, pw);
			
			if (members.isEmpty()) {
				return new ResponseEntity<>(HttpStatus.NO_CONTENT);
			}
			return new ResponseEntity<>(members, HttpStatus.OK);
		} catch (Exception e) {
			return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}	
	
	/*
	@GetMapping(value = "/pako")
	public ResponseEntity<String> getApiPako() throws IOException {
		
		ClassPathResource resource = new ClassPathResource("static/pako.js");

		try {
		    Path path = Paths.get(resource.getURI());
		    List<String> content = Files.readAllLines(path);
		    
//		    StringBuffer sb = new StringBuffer();
		    String writeScript = "";
		    
		    for(int i=0; i<content.size(); i++) {
		    	if(i != 0) {
		    		writeScript += "\n";
		    	}
		    	writeScript += content.get(i);
			}
		    
//	        for (String readLine : content) {
//	            sb.append(readLine);
//	        }
		    
		    return ResponseEntity.ok()
		    			.header(HttpHeaders.ACCEPT_RANGES, "bytes")
		    			.header(HttpHeaders.CONNECTION, "Keep-Alive")
		    			.header(HttpHeaders.CONTENT_ENCODING, "")
		    			.header(HttpHeaders.CONTENT_TYPE, "application/javascript") //charset=UTF-8
		    			.body(writeScript);
		} catch (IOException e) {
		    //log.error("{}", e.getMessage(), e);
		}
		return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
	}
	
	@GetMapping(value = "/mercator")
	public ResponseEntity<String> getApiMercator() throws IOException {
		
		ClassPathResource resource = new ClassPathResource("static/global-mercator.js");

		try {
		    Path path = Paths.get(resource.getURI());
		    List<String> content = Files.readAllLines(path);
		    
		    String writeScript = "";
		    
		    for(int i=0; i<content.size(); i++) {
		    	if(i != 0) {
		    		writeScript += "\n";
		    	}
		    	writeScript += content.get(i);
			}
		    
		    return ResponseEntity.ok()
		    			.header(HttpHeaders.ACCEPT_RANGES, "bytes")
		    			.header(HttpHeaders.CONNECTION, "Keep-Alive")
		    			.header(HttpHeaders.CONTENT_ENCODING, "")
		    			.header(HttpHeaders.CONTENT_TYPE, "application/javascript") //"text/javascript" //application/javascript
		    			.body(writeScript);
		} catch (IOException e) {
		    //log.error("{}", e.getMessage(), e);
		}
		return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
	}	

	@GetMapping(value = "/vectorUtils")
	public ResponseEntity<String> getApiVectorUtils() throws IOException {
		
		ClassPathResource resource = new ClassPathResource("static/vectortile-utils.js");

		try {
		    Path path = Paths.get(resource.getURI());
		    List<String> content = Files.readAllLines(path);
		    
		    String writeScript = "";
		    
		    for(int i=0; i<content.size(); i++) {
		    	if(i != 0) {
		    		writeScript += "\n";
		    	}
		    	writeScript += content.get(i);
			}
		    
		    return ResponseEntity.ok()
		    			.header(HttpHeaders.ACCEPT_RANGES, "bytes")
		    			.header(HttpHeaders.CONNECTION, "Keep-Alive")
		    			.header(HttpHeaders.CONTENT_ENCODING, "")
		    			.header(HttpHeaders.CONTENT_TYPE, "application/javascript")
		    			.body(writeScript);
		} catch (IOException e) {
		    //log.error("{}", e.getMessage(), e);
		}
		return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
	}		
	*/
}