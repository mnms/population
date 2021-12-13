package kr.co.ltdb;

import org.junit.Assert;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;

import kr.co.ltdb.entity.Member;
import kr.co.ltdb.repository.MemberRepository;

@SpringBootTest
@Rollback(false)
public class MemberServiceTests {
    @Autowired
    private MemberRepository memberRepository;

    @Test
    public void saveMemberTest() {

        //given
        Member member = new Member();
        member.setName("ltdb");
        member.setPw("1234");
        memberRepository.save(member);

        // when
        Member retrivedMember = memberRepository.findById(member.getId()).get();

        // then
        Assert.assertEquals(retrivedMember.getName(), "ltdb");
        Assert.assertEquals(retrivedMember.getPw(), "1234"); //Integer.valueOf(32)
    }
}
