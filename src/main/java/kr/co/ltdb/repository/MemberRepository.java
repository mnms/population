package kr.co.ltdb.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.ltdb.entity.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
	List<Member> findByNameContaining(String name);
	List<Member> findByName(String name);
	List<Member> findByNameAndPw(String name, String pw);
}
